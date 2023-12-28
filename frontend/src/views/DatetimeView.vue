<script setup lang="ts">
import liff from '@line/liff';
import { ref } from 'vue';
import { format, isFuture, subMinutes } from 'date-fns';

const date = ref<Date>();
const time = ref<Date>();

liff.init({
  liffId: import.meta.env.VITE_LIFF_ID,
});

const onSubmit = () => {
  if (date.value && time.value)
    liff
      .sendMessages([
        {
          type: 'text',
          text: format(
            subMinutes(date.value, date.value.getTimezoneOffset()).toISOString().split('T')[0] +
              'T' +
              time.value.toISOString().split('T')[1],
            'yyyy-MM-ddのHH:mm',
          ),
        },
      ])
      .then(() => liff.closeWindow());
};
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center">
    <div class="flex flex-col gap-2">
      <VaDateInput v-model="date" :allowed-days="(date) => isFuture(date) && date.getDay() !== 2" />
      <VaTimeInput
        v-model="time"
        :hours-filter="(h) => h >= 10 && h <= 20"
        :minutes-filter="(m) => m % 10 === 0"
      />
      <VaButton :disabled="!date || !time" @click="onSubmit">Submit</VaButton>
      <div class="h-[30vh]"></div>
    </div>
  </div>
</template>
