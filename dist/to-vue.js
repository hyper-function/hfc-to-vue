import { onBeforeUpdate } from "vue";
export default function (Vue) {
    const { h, ref, watch, toRef, reactive, computed, Teleport, onMounted, onBeforeUnmount, defineComponent, } = Vue;
    return function hfcToVue(HFC) {
        const propTypes = HFC.propTypes || {};
        const propKeys = Object.keys(propTypes.attrs || {});
        const eventKeys = Object.keys(propTypes.events || {});
        const slotKeys = Object.keys(propTypes.slots || {});
        const eventKeyMap = {};
        for (let i = 0; i < eventKeys.length; i++) {
            const key = eventKeys[i];
            eventKeyMap["on" + key[0].toUpperCase() + key.slice(1)] = key;
        }
        const slotKeyMap = {};
        for (let i = 0; i < slotKeys.length; i++) {
            const key = slotKeys[i];
            slotKeyMap[key.toLowerCase()] = key;
        }
        const observeEventKeys = Object.keys(eventKeyMap);
        return defineComponent({
            props: propKeys,
            inheritAttrs: false,
            setup(vueProps, ctx) {
                const container = ref();
                const attrKeys = Object.keys(ctx.attrs);
                function handleAttrs(isFirst) { }
                handleAttrs(true);
                onBeforeUpdate(() => handleAttrs(false));
                const events = {};
                if (observeEventKeys.length) {
                    for (let i = 0; i < observeEventKeys.length; i++) {
                        const key = observeEventKeys[i];
                        const event = ctx.attrs[key];
                        if (!event)
                            continue;
                        events[eventKeyMap[key]] = event;
                    }
                }
                const slots = {};
                const renderedSlots = reactive({});
                Object.keys(ctx.slots).forEach((slotKey) => {
                    const key = slotKeyMap[slotKey.replace(/-/g, "").toLowerCase()];
                    if (!key)
                        return;
                    const slot = ctx.slots[slotKey];
                    slots[key] = function (container, args) {
                        if (!container) {
                            delete renderedSlots[key];
                            return;
                        }
                        const slotItem = renderedSlots[key];
                        if (!slotItem) {
                            renderedSlots[key] = { name: key, container, slot: slot, args };
                            return;
                        }
                        if (slotItem.container !== container) {
                            slotItem.container = container;
                        }
                        slotItem.args = args;
                    };
                });
                let hfc;
                const attrs = {};
                for (let i = 0; i < propKeys.length; i++) {
                    const key = propKeys[i];
                    if (vueProps[key] == undefined)
                        continue;
                    let value = vueProps[key];
                    if (value === "") {
                        if (propTypes.attrs[key].t === "#b")
                            value = true;
                    }
                    attrs[key] = value;
                    watch(toRef(vueProps, key), (curr, prev) => {
                        var _a;
                        console.log("change");
                        console.log(curr);
                        attrs[key] = curr;
                        (_a = hfc.changed) === null || _a === void 0 ? void 0 : _a.call(hfc, "attr", key, prev, curr);
                    }, { deep: true });
                }
                hfc = new HFC({
                    attrs,
                    events,
                    slots,
                });
                onMounted(() => {
                    hfc.connected(container.value);
                });
                onBeforeUnmount(() => {
                    var _a;
                    (_a = hfc.disconnected) === null || _a === void 0 ? void 0 : _a.call(hfc);
                });
                const renderedSlotVnodes = computed(() => {
                    return Object.keys(renderedSlots).map((key) => {
                        const item = renderedSlots[key];
                        return h(Teleport, { to: item.container }, item.slot(item.args));
                    });
                });
                return () => [
                    h(HFC.tag || "div", { ref: container }),
                    renderedSlotVnodes.value,
                ];
            },
        });
    };
}
