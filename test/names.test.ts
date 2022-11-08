/// <reference types="../src/hfc" />
import { mount } from "@vue/test-utils";
import hfcToVue from "../src";

const DemoHfc: HyperFunctionComponent = function DemoHfc(container, props) {
  container.innerHTML = JSON.stringify({
    attrs: props.attrs,
    events: Object.keys(props.events),
    slots: Object.keys(props.slots),
    _: Object.keys(props._),
  });

  return {
    methods: {},
    changed() {},
    disconnected() {},
  };
};

DemoHfc.tag = "strong";
DemoHfc.ver = "1.0.0";
DemoHfc.hfc = "demo-hfc";
DemoHfc.names = [
  [
    "a",
    "ab",
    "aC",
    "abc",
    "abD",
    "aBe",
    "aBF",
    "abcd",
    "aBce",
    "abCf",
    "abcG",
    "aBCh",
    "aBCI",
    "aBcJ",
    "aBCK",
    "abCL",

    "bC",
    "bbD",
    "bBe",
    "bBF",
    "bBce",
    "bbCf",
    "bbcG",
    "bBCh",
    "bBCI",
    "bBcJ",
    "bBCK",
    "bbCL",

    "cAB",
    "cAbCd",
  ],
  ["onClick", "click", "onDbClick", "onPress", "onDbPress", "onTouch"],
  ["default", "header", "topNav", "actionBar"],
  [],
];

test("pass attrs and events", () => {
  const Hfc = hfcToVue(DemoHfc);
  const wrapper = mount({
    template: `
      <hfc
        a="1"
        ab="2"
        aC="3"
        abc="4"
        abD="5"
        aBe="6"
        aBF="7"
        abcd="8"
        aBce="9"
        abCf="10"
        abcG="11"
        aBCh="12"
        aBCI="13"
        aBcJ="14"
        aBCK="15"
        abCL="16"

        b-c="30"
        bb-d="31"
        b-be="32"
        b-b-f="33"
        b-bce="34"
        bb-cf="35"
        bbc-g="36"
        b-b-ch="37"
        b-b-c-i="38"
        b-bc-j="39"
        b-b-c-k="40"
        bb-c-l="41"

        cab="50"
        cabcd="51"

        @onClick="true"
        @click="true"
        @onDbClick="true"
        @on-press="true"
        @on-db-press="true"
        @ontouch="true"

        nb="1"
        nBa="2"
        n-b-c="3"
        onCall="4"
        onload="5"
      >
        <h1>default slot</h1>
        <template #header>header slot</template>
        <template #topNav>header slot</template>
        <template #action-bar>header slot</template>
      </hfc>`,
    components: { Hfc },
  });

  const html = wrapper.html();
  expect(html).include("</strong>");
  expect(html).include('data-hfc="demo-hfc"');

  const hfcProps = JSON.parse(wrapper.get("strong").text());
  expect(hfcProps.attrs.a).equal("1");
  expect(hfcProps.attrs.ab).equal("2");
  expect(hfcProps.attrs.aC).equal("3");
  expect(hfcProps.attrs.abc).equal("4");
  expect(hfcProps.attrs.abD).equal("5");
  expect(hfcProps.attrs.aBe).equal("6");
  expect(hfcProps.attrs.aBF).equal("7");
  expect(hfcProps.attrs.abcd).equal("8");
  expect(hfcProps.attrs.aBce).equal("9");
  expect(hfcProps.attrs.abCf).equal("10");
  expect(hfcProps.attrs.abcG).equal("11");
  expect(hfcProps.attrs.aBCh).equal("12");
  expect(hfcProps.attrs.aBCI).equal("13");
  expect(hfcProps.attrs.aBcJ).equal("14");
  expect(hfcProps.attrs.aBCK).equal("15");
  expect(hfcProps.attrs.abCL).equal("16");

  expect(hfcProps.attrs.bC).equal("30");
  expect(hfcProps.attrs.bbD).equal("31");
  expect(hfcProps.attrs.bBe).equal("32");
  expect(hfcProps.attrs.bBF).equal("33");
  expect(hfcProps.attrs.bBce).equal("34");
  expect(hfcProps.attrs.bbCf).equal("35");
  expect(hfcProps.attrs.bbcG).equal("36");
  expect(hfcProps.attrs.bBCh).equal("37");
  expect(hfcProps.attrs.bBCI).equal("38");
  expect(hfcProps.attrs.bBcJ).equal("39");
  expect(hfcProps.attrs.bBCK).equal("40");
  expect(hfcProps.attrs.bbCL).equal("41");

  expect(hfcProps.attrs.cAB).equal("50");
  expect(hfcProps.attrs.cAbCd).equal("51");

  expect(hfcProps.events).contain("onClick");
  expect(hfcProps.events).contain("onClick");
  expect(hfcProps.events).contain("click");
  expect(hfcProps.events).contain("onDbClick");
  expect(hfcProps.events).contain("onPress");
  expect(hfcProps.events).contain("onDbPress");
  expect(hfcProps.events).contain("onTouch");

  expect(hfcProps.slots).contains("default");
  expect(hfcProps.slots).contains("header");
  expect(hfcProps.slots).contains("topNav");
  expect(hfcProps.slots).contains("actionBar");

  expect(hfcProps._).contains("a");
  expect(hfcProps._).contains("nb");
  expect(hfcProps._).contains("nBa");
  expect(hfcProps._).contains("n-b-c");
  expect(hfcProps._).contains("onCall");
  expect(hfcProps._).contains("onload");
});
