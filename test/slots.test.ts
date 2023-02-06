import type { HyperFunctionComponent } from "hyper-function-component";
import { nextTick } from "vue";
import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import hfcToVue from "../src";

const DemoHfc: HyperFunctionComponent = function DemoHfc(initProps) {
  let target: Element;
  let defaultSlot: HTMLElement | undefined;
  let headerSlot: HTMLElement | undefined;
  let footerSlot: HTMLElement | undefined;

  let renderCount = 0;
  function renderSlot(ps: any) {
    if (ps.slots.default) {
      if (!defaultSlot) {
        defaultSlot = document.createElement("main");
        target.append(defaultSlot);
      }
      ps.slots.default(defaultSlot);
    } else {
      if (defaultSlot) {
        defaultSlot.remove();
        defaultSlot = undefined;
      }
    }

    if (ps.slots.header) {
      if (!headerSlot) {
        headerSlot = document.createElement("header");
        target.append(headerSlot);
      }
      ps.slots.header(headerSlot);
    } else {
      if (headerSlot) {
        headerSlot.remove();
        headerSlot = undefined;
      }
    }

    if (ps.slots.footer) {
      if (!footerSlot) {
        footerSlot = document.createElement("footer");
        target.append(footerSlot);
      }
      ps.slots.footer(footerSlot, { count: ++renderCount });
    } else {
      if (footerSlot) {
        footerSlot.remove();
        footerSlot = undefined;
      }
    }
  }

  return {
    methods: {},
    connected(container) {
      target = container;
      renderSlot(initProps);
    },
    changed(props) {
      renderSlot(props);
    },
    disconnected() {},
  };
};

DemoHfc.tag = "strong";
DemoHfc.ver = "1.0.0";
DemoHfc.hfc = "demo-hfc";
DemoHfc.names = [[], [], ["default", "header", "footer"], []];

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
        <template #footer="props"><h5>{{props.count}}</h5></template>
      </hfc>
    `,
    components: { Hfc },
  });

  await nextTick();

  const html = wrapper.html();
  // console.log(html);
  expect(html).include("<main><h1>default slot</h1></main>");
  expect(html).include("<header><h3>header slot</h3></header>");
  expect(html).include("<footer><h5>1</h5></footer>");

  wrapper.setData({ showHeader: false });
  await nextTick();

  const html1 = wrapper.html();
  // console.log(html1);
  expect(html1).not.include("<header><h3>header slot</h3></header>");
  expect(html1).include("<footer><h5>2</h5></footer>");
});
