import type { HyperFunctionComponent } from "hyper-function-component";
import { test, expect } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import hfcToVue from "../src";

const DemoHfc: HyperFunctionComponent = function DemoHfc(initProps) {
  return {
    methods: {},
    connected(container) {
      initProps.events!.onClick!({ count: 6 });
    },
    updated(props) {},
    disconnected() {},
  };
};

DemoHfc.tag = "strong";
DemoHfc.ver = "1.0.0";
DemoHfc.hfc = "demo-hfc";
DemoHfc.names = [[], ["onClick"], [], []];

test("pass events", async () => {
  const Hfc = hfcToVue(DemoHfc);
  const wrapper = mount({
    data() {
      return { clicked: 0 };
    },
    template: `
      <hfc @onClick="onClick" @onHover="onClick" @onmove="onClick"></hfc>
      <div v-if="clicked > 0">clicked {{clicked}}</div>
    `,
    methods: {
      onClick({ count }: { count: number }) {
        this.clicked = count;
      },
    },
    components: {
      Hfc,
    },
  });

  await nextTick();
  const html = wrapper.html();
  expect(html).include("<div>clicked 6</div>");
});
