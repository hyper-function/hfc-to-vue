import {
  h,
  ref,
  watch,
  toRaw,
  inject,
  provide,
  isProxy,
  reactive,
  Teleport,
  onMounted,
  onBeforeUpdate,
  onBeforeUnmount,
  defineComponent,
} from "vue";

import toVue from "./to-vue.js";

export default toVue({
  h,
  ref,
  watch,
  toRaw,
  inject,
  provide,
  isProxy,
  reactive,
  Teleport,
  onMounted,
  onBeforeUpdate,
  onBeforeUnmount,
  defineComponent,
} as any);
