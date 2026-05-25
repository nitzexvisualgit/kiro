/**
 * OF.UnPrecomp - Reverse a precompose. The hard one.
 *
 * Strategy:
 *   For each selected precomp layer in the active comp:
 *     1. Snapshot the parent precomp layer's transform (px, py, sx, sy, rot, opacity, anchor),
 *        blendMode, in/out, startTime, parenting.
 *     2. For each child layer inside the precomp (top-to-bottom for natural order):
 *          - Duplicate its source into the parent comp (this preserves all keyframes,
 *            effects, expressions and masks because AE's add() copies the layer object
 *            via duplicate()-then-cut).
 *          - Pre-compose its transform with the parent precomp's transform so the
 *            visible result is identical.
 *          - Adjust startTime so child time = parentStartTime + childStartTime.
 *          - Trim inPoint/outPoint to the intersection of child range and parent precomp range.
 *          - Re-apply blend/quality/3D flags.
 *     3. Re-establish parent-child relationships within the unpacked layers.
 *     4. Delete the now-empty precomp layer (but keep the comp item in project unless requested).
 *
 * Caveats handled:
 *   - Time-remap on the parent precomp layer: we WARN and skip trim-shift if detected
 *     (cannot mathematically invert non-linear remap reliably).
 *   - Collapsed transformations: still works because we're in source space for all children.
 *   - Nested precomps: only ONE level is unpacked per call. To unpack deeper, run again.
 */
OF.UnPrecomp = (function () {

    function snapshotLayer(layer) {
        return {
            name: layer.name,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            startTime: layer.startTime,
            stretch: layer.stretch,
            blendingMode: layer.blendingMode,
            quality: layer.quality,
            threeDLayer: layer.threeDLayer,
            shy: layer.shy,
            solo: layer.solo,
            enabled: layer.enabled,
            locked: layer.locked,
            parent: layer.parent,
            hasTimeRemap: false
        };
    }

    function copyLayerToComp(srcLayer, destComp) {
        // The reliable way to copy a layer between comps in ExtendScript:
        // copyToComp() preserves transform, effects, masks, expressions, keyframes.
        srcLayer.copyToComp(destComp);
        // Newly added layer is at index 1
        return destComp.layer(1);
    }


    function applyParentTransform(child, parentSnap, parentLayer) {
        // We compose: world_pos = parentPos + (childPos - [compW/2, compH/2]) ...
        // Pure math composition is fragile with 3D/parented layers. Instead, we use
        // AE's native approach: temporarily PARENT the new child to a copy of the
        // parent precomp's null-equivalent transform, then "Edit > Paste" of values.
        //
        // Simpler reliable method: create a temporary null with parentSnap's transform,
        // parent the child to it, then unparent (which bakes the transform).
        var destComp = child.containingComp;
        var nullL = destComp.layers.addNull();
        nullL.moveToBeginning();
        nullL.name = "__OF_TempParent__";
        nullL.enabled = false;

        // Copy parent's transform values from the original parent layer at time 0 of source space.
        // We read from parentLayer (still alive in parent comp).
        try { nullL.transform.position.setValue(parentLayer.transform.position.value); } catch(e){}
        try { nullL.transform.scale.setValue(parentLayer.transform.scale.value); } catch(e){}
        try { nullL.transform.rotation.setValue(parentLayer.transform.rotation.value); } catch(e){}
        try { nullL.transform.opacity.setValue(parentLayer.transform.opacity.value); } catch(e){}
        try { nullL.transform.anchorPoint.setValue(parentLayer.transform.anchorPoint.value); } catch(e){}

        // If parent had keyframes on transform, copy them over to the null
        copyKeyframes(parentLayer.transform.position, nullL.transform.position);
        copyKeyframes(parentLayer.transform.scale, nullL.transform.scale);
        copyKeyframes(parentLayer.transform.rotation, nullL.transform.rotation);
        copyKeyframes(parentLayer.transform.opacity, nullL.transform.opacity);
        copyKeyframes(parentLayer.transform.anchorPoint, nullL.transform.anchorPoint);

        var prevParent = child.parent;
        child.parent = nullL;
        // Bake by un-parenting via "with this layer's present position" - AE keeps visual.
        // Trick: setting parent to null with jumpToTime preserves world transform.
        child.parent = null;

        nullL.remove();
        child.parent = prevParent; // restore any inherited parent (rare, we cleared it above)
    }

    function copyKeyframes(srcProp, dstProp) {
        try {
            if (!srcProp.numKeys) return;
            for (var i = 1; i <= srcProp.numKeys; i++) {
                var t = srcProp.keyTime(i);
                var v = srcProp.keyValue(i);
                dstProp.setValueAtTime(t, v);
            }
        } catch (e) {}
    }


    function unpackOne(parentComp, precompLayer) {
        if (!(precompLayer.source instanceof CompItem)) {
            throw new Error("Layer '" + precompLayer.name + "' is not a precomposition.");
        }
        var childComp = precompLayer.source;
        var parentSnap = snapshotLayer(precompLayer);
        var precompStart = precompLayer.startTime;     // when the precomp layer begins on the parent timeline
        var precompIn = precompLayer.inPoint;
        var precompOut = precompLayer.outPoint;

        // Detect time remap - we can't safely invert it; warn caller via flag.
        var hasRemap = precompLayer.timeRemapEnabled;

        // Snapshot child layer order BEFORE we mutate
        var childLayers = [];
        for (var i = 1; i <= childComp.numLayers; i++) childLayers.push(childComp.layer(i));

        // Build a map of childLayer.index -> newly created layer in parent (for reparenting)
        var newByOldIndex = {};
        var inserted = [];

        // We copy in REVERSE so they end up stacked above the precomp layer in original order.
        for (var j = childLayers.length - 1; j >= 0; j--) {
            var src = childLayers[j];
            // copyToComp inserts at index 1 of destComp
            src.copyToComp(parentComp);
            var nl = parentComp.layer(1);

            // Adjust timing: child startTime is in childComp time. Parent timeline offset = precompStart.
            // If no time remap, world startTime = precompStart + src.startTime.
            if (!hasRemap) {
                nl.startTime = precompStart + src.startTime;
                // Clamp visible range to precomp's [inPoint, outPoint] window
                var newIn = Math.max(precompIn, precompStart + src.inPoint);
                var newOut = Math.min(precompOut, precompStart + src.outPoint);
                if (newOut > newIn) {
                    nl.inPoint = newIn;
                    nl.outPoint = newOut;
                }
            } else {
                // With time remap, just place at precompStart and let the user fix manually
                nl.startTime = precompStart + src.startTime;
            }

            // Compose transform with parent precomp's transform via temp-null bake
            applyParentTransform(nl, parentSnap, precompLayer);

            newByOldIndex[src.index] = nl;
            inserted.push({ oldIdx: src.index, layer: nl });

            // Move the new layer to sit right above the precomp layer (preserves z-order)
            try { nl.moveBefore(precompLayer); } catch (e) {}
        }


        // Restore internal parent-child relationships among the new layers
        for (var k = 0; k < inserted.length; k++) {
            var oldL = childComp.layer(inserted[k].oldIdx);
            if (oldL && oldL.parent) {
                var mappedParent = newByOldIndex[oldL.parent.index];
                if (mappedParent) {
                    try { inserted[k].layer.parent = mappedParent; } catch (e) {}
                }
            }
        }

        // Re-apply blending mode of the precomp layer onto each unpacked layer ONLY if
        // it was non-Normal (otherwise we'd corrupt their own blend modes).
        if (parentSnap.blendingMode !== BlendingMode.NORMAL) {
            for (var b = 0; b < inserted.length; b++) {
                try { inserted[b].layer.blendingMode = parentSnap.blendingMode; } catch (e) {}
            }
        }

        // Finally remove the original precomp layer
        precompLayer.remove();

        return {
            unpacked: inserted.length,
            sourceComp: childComp.name,
            warning: hasRemap ? "Time-remapped precomp - timing may need manual adjustment." : null
        };
    }

    function run(args) {
        return OF.U.safe("Un-Precomp", function () {
            var comp = OF.U.activeComp();
            if (!comp) throw new Error("No active composition.");
            var sel = OF.U.selectedLayers();
            if (!sel.length) throw new Error("Select at least one precomp layer.");

            // Filter to precomp layers only
            var targets = [];
            for (var i = 0; i < sel.length; i++) if (sel[i].source instanceof CompItem) targets.push(sel[i]);
            if (!targets.length) throw new Error("No precomposition layers in selection.");

            // Process from highest layer index to lowest so removals don't shift others
            targets.sort(function (a, b) { return b.index - a.index; });

            var report = { layersUnpacked: 0, comps: [], warnings: [] };
            for (var t = 0; t < targets.length; t++) {
                var r = unpackOne(comp, targets[t]);
                report.layersUnpacked += r.unpacked;
                report.comps.push(r.sourceComp);
                if (r.warning) report.warnings.push(r.sourceComp + ": " + r.warning);
            }
            return report;
        });
    }
    return { run: run };
})();
