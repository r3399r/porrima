<script setup lang="ts">
import liff from '@line/liff';
import { ref } from 'vue';
import { format, isFuture, subMinutes } from 'date-fns';

const date = ref<Date>();
const time = ref<Date>();
const isSubmitted = ref<boolean>(false);

liff.init({
  liffId: import.meta.env.VITE_LIFF_ID,
});

const onSubmit = () => {
  if (date.value && time.value) {
    isSubmitted.value = true;
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
      .then(() => liff.closeWindow())
      .catch(() => {
        isSubmitted.value = false;
      });
  }
};
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center">
    <div class="flex w-4/5 flex-col gap-2">
      <div>ご都合の良い日時をお選びください</div>
      <VaDateInput
        v-model="date"
        :allowed-days="(date) => isFuture(date) && date.getDay() !== 2"
        clearable
        placeholder="Date"
      />
      <VaTimeInput
        v-model="time"
        :hours-filter="(h) => h >= 10 && h <= 20"
        :minutes-filter="(m) => m % 10 === 0"
        clearable
        placeholder="Time"
      />
      <VaButton :disabled="!date || !time || isSubmitted" @click="onSubmit">Submit</VaButton>
      <div class="h-[30vh]"></div>
    </div>
  </div>
</template>
