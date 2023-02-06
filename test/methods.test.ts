import type { HyperFunctionComponent } from "hyper-function-component";
import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import hfcToVue from "../src";

const DemoHfc: HyperFunctionComponent = function DemoHfc(initProps) {
  let target: Element;
  return {
    methods: {
      show(args) {
        const duration = args!.duration;
        target.innerHTML = "duration: " + duration;
      },
    },
    connected(container) {
      target = container;
    },
    changed() {},
    disconnected() {},
  };
};

DemoHfc.tag = "strong";
DemoHfc.ver = "1.0.0";
DemoHfc.hfc = "demo-hfc";
DemoHfc.names = [[], [], [], ["show"]];

test("pass events", async () => {
  const Hfc = hfcToVue(DemoHfc);
  const wrapper = mount({
    template: `
      <hfc ref="hfc" />
    `,
    components: {
      Hfc,
    },
    methods: {
      show() {
        console.log(this.$refs.hfc.hfc.methods.show({ duration: 8 }));
      },
    },
  });

  wrapper.vm.show();

  const html = wrapper.html();
  expect(html).include("duration: 8");
});
