import type {
  HyperFunctionComponent,
  HfcSlotOptions,
} from "hyper-function-component";
import { nextTick } from "vue";
import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import hfcToVue from "../src";

function buildHfcSlot(target: Element, args: any) {
  return {
    args,
    target,
    change(args) {
      this.args = args;
      this.updated?.();
    },
    remove() {
      if (this.target.parentNode) {
        this.target.parentNode.removeChild(this.target);
      }
      this.removed?.();
    },
  };
}

const DemoHfc: HyperFunctionComponent = function DemoHfc(initProps) {
  let slots = initProps.slots || {};
  let target: Element;
  let defaultSlot: ReturnType<typeof buildHfcSlot> | undefined;
  let headerSlot: ReturnType<typeof buildHfcSlot> | undefined;
  let footerSlot: ReturnType<typeof buildHfcSlot> | undefined;

  let renderCount = 0;

  return {
    methods: {},
    connected(container) {
      target = container;

      if (initProps.slots?.default) {
        defaultSlot = buildHfcSlot(document.createElement("main"), {});
        target.append(defaultSlot.target);
        initProps.slots.default(defaultSlot);
      }

      if (initProps.slots?.header) {
        headerSlot = buildHfcSlot(document.createElement("header"), {});
        target.append(headerSlot.target);
        initProps.slots.header(headerSlot);
      }

      if (initProps.slots?.footer) {
        footerSlot = buildHfcSlot(document.createElement("footer"), {
          count: ++renderCount,
        });
        target.append(footerSlot.target);
        initProps.slots!.footer(footerSlot);
      }
    },
    updated(props) {
      if (props.slots?.default) {
        if (props.slots.default !== slots.default) {
          if (defaultSlot) {
            defaultSlot.remove();
          }

          defaultSlot = buildHfcSlot(document.createElement("main"), {});
          target.append(defaultSlot.target);
          props.slots.default(defaultSlot);
        }
      } else {
        if (defaultSlot) {
          defaultSlot.remove();
          defaultSlot = undefined;
        }
      }

      if (props.slots?.header) {
        if (props.slots.header !== slots.header) {
          if (headerSlot) {
            headerSlot.remove();
          }

          headerSlot = buildHfcSlot(document.createElement("header"), {});
          target.append(headerSlot.target);
          props.slots.header(headerSlot);
        }
      } else {
        if (headerSlot) {
          headerSlot.remove();
          headerSlot = undefined;
        }
      }

      if (props.slots?.footer) {
        if (props.slots.footer !== slots.footer) {
          if (footerSlot) {
            footerSlot.remove();
          }

          footerSlot = buildHfcSlot(document.createElement("footer"), {
            count: ++renderCount,
          });
          target.append(footerSlot.target);
          props.slots.footer(footerSlot);
        }
      } else {
        if (footerSlot) {
          footerSlot.remove();
          footerSlot = undefined;
        }
      }
    },
    disconnected() {},
  };
};

DemoHfc.tag = "strong";
DemoHfc.ver = "1.0.0";
DemoHfc.hfc = "demo-hfc";
DemoHfc.names = [[], [], ["default", "header", "footer", "title"], []];

test("pass slots", async () => {
  const Hfc = hfcToVue(DemoHfc);
  const wrapper = mount({
    data() {
      return { showHeader: true };
    },
    template: `
      <hfc>
        <h1>default slot</h1>
        <template v-if="showHeader" #header><h3>header slot</h3></template>
        <template #footer="{count}"><h5>{{count}}</h5></template>
        <template #title>title</template>
      </hfc>
    `,
    components: { Hfc },
  });

  await nextTick();

  const html = wrapper.html();
  console.log(html);
  expect(html).include("<main><h1>default slot</h1></main>");
  expect(html).include("<header><h3>header slot</h3></header>");
  expect(html).include("<footer><h5>1</h5></footer>");

  wrapper.setData({ showHeader: false });
  await nextTick();

  const html1 = wrapper.html();
  console.log(html1);
  expect(html1).not.include("<header><h3>header slot</h3></header>");
  expect(html1).include("<footer><h5>2</h5></footer>");
});
