import {
  h,
  ref,
  watch,
  toRef,
  Teleport,
  reactive,
  onMounted,
  onBeforeUpdate,
  onBeforeUnmount,
  defineComponent,
  computed,
} from "vue";

import toVue from "./to-vue.js";

export default toVue({
  h,
  ref,
  watch,
  toRef,
  Teleport,
  reactive,
  onMounted,
  onBeforeUpdate,
  onBeforeUnmount,
  defineComponent,
  computed,
} as any);
