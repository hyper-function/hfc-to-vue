import type IVue from "vue";
import { onBeforeUpdate } from "vue";

interface RenderSlotItem {
  name: string;
  container: HTMLElement;
  slot: IVue.Slot;
  args: any;
}

export default function (Vue: typeof IVue) {
  const {
    h,
    ref,
    watch,
    toRef,
    reactive,
    computed,
    Teleport,
    onMounted,
    onBeforeUnmount,
    defineComponent,
  } = Vue;

  return function hfcToVue(HFC: typeof HyperFunctionComponent) {
    const propTypes = HFC.propTypes || {};
    const propKeys = Object.keys(propTypes.attrs || {});
    const eventKeys = Object.keys(propTypes.events || {});
    const slotKeys = Object.keys(propTypes.slots || {});

    const eventKeyMap: Record<string, string> = {};
    for (let i = 0; i < eventKeys.length; i++) {
      const key = eventKeys[i];
      eventKeyMap["on" + key[0].toUpperCase() + key.slice(1)] = key;
    }

    const slotKeyMap: Record<string, string> = {};
    for (let i = 0; i < slotKeys.length; i++) {
      const key = slotKeys[i];
      slotKeyMap[key.toLowerCase()] = key;
    }

    const observeEventKeys = Object.keys(eventKeyMap);

    return defineComponent({
      props: propKeys,
      inheritAttrs: false,
      setup(vueProps, ctx) {
        const container = ref<HTMLElement>();

        const attrKeys = Object.keys(ctx.attrs);
        function handleAttrs(isFirst: boolean) {}

        handleAttrs(true);
        onBeforeUpdate(() => handleAttrs(false));

        const events: Record<string, any> = {};
        if (observeEventKeys.length) {
          for (let i = 0; i < observeEventKeys.length; i++) {
            const key = observeEventKeys[i];
            const event = ctx.attrs[key];
            if (!event) continue;
            events[eventKeyMap[key]] = event;
          }
        }

        const slots: Record<string, any> = {};
        const renderedSlots: Record<string, RenderSlotItem> = reactive({});

        Object.keys(ctx.slots).forEach((slotKey) => {
          const key = slotKeyMap[slotKey.replace(/-/g, "").toLowerCase()];
          if (!key) return;

          const slot = ctx.slots[slotKey];
          slots[key] = function (container: HTMLElement | null, args: any) {
            if (!container) {
              delete renderedSlots[key];
              return;
            }

            const slotItem = renderedSlots[key];
            if (!slotItem) {
              renderedSlots[key] = { name: key, container, slot: slot!, args };
              return;
            }

            if (slotItem.container !== container) {
              slotItem.container = container;
            }

            slotItem.args = args;
          };
        });

        let hfc: HyperFunctionComponent;
        const attrs: Record<string, any> = {};

        for (let i = 0; i < propKeys.length; i++) {
          const key = propKeys[i];
          if (vueProps[key] == undefined) continue;

          let value = vueProps[key];
          if (value === "") {
            if (propTypes.attrs![key].t === "#b") value = true;
          }

          attrs[key] = value;

          watch(
            toRef(vueProps, key),
            (curr, prev) => {
              console.log("change");
              console.log(curr);
              attrs[key] = curr;
              hfc.changed?.("attr", key, prev, curr);
            },
            { deep: true }
          );
        }

        hfc = new HFC({
          attrs,
          events,
          slots,
        });

        onMounted(() => {
          hfc.connected(container.value as HTMLDivElement);
        });

        onBeforeUnmount(() => {
          hfc.disconnected?.();
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
