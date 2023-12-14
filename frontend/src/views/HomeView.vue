<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';

const reservation = ref();

axios
  .request({
    method: 'GET',
    url: '/api/reservation',
    timeout: 30000,
  })
  .then((res) => (reservation.value = res.data));
</script>

<template>
  <div class="flex items-center gap-2 border-b border-solid border-b-black p-2 font-bold">
    <div class="w-1/12"></div>
    <div class="w-2/12">名前</div>
    <div class="w-1/12">ご用件</div>
    <div class="w-1/12">修理対象</div>
    <div class="w-1/12">修理箇所</div>
    <div class="w-1/12">写真</div>
    <div class="w-1/12">ご相談</div>
    <div class="w-1/12">ご相談日時</div>
    <div class="w-2/12">その他</div>
    <div class="w-1/12">Status</div>
  </div>
  <div
    class="flex items-center gap-2 border-b border-solid border-b-black p-2"
    :class="{ 'bg-yellow-50': index % 2 === 0, 'bg-orange-50': index % 2 === 1 }"
    v-for="(r, index) of reservation"
    :key="index"
  >
    <div class="flex w-1/12 items-center justify-center">
      <img v-if="r.Profile.pictureUrl" :src="r.Profile.pictureUrl" class="w-10 rounded-full" />
      <div v-else class="h-10 w-10 rounded-full bg-gray-400"></div>
    </div>
    <div class="w-2/12">{{ r.Profile.displayName }}</div>
    <div class="w-1/12">{{ r.OrderType }}</div>
    <div class="w-1/12">{{ r.TargetType }}</div>
    <div class="w-1/12">{{ r.Quantity }}</div>
    <div class="flex w-1/12 flex-wrap gap-1">
      <a v-for="(p, idx) of r.Photo ?? []" :href="p" class="text-blue-700 underline" :key="idx"
        >写真{{ idx + 1 }}
      </a>
    </div>
    <div class="w-1/12">{{ r.MeetingType }}</div>
    <div class="w-1/12">{{ r.MeetingTime }}</div>
    <div class="w-2/12">{{ r.Comment }}</div>
    <div
      class="w-1/12"
      :class="{ 'text-green-700': r.Status === 'end', 'text-red-700': r.Status !== 'end' }"
    >
      {{ r.Status === 'end' ? 'Done' : 'Not yet' }}
    </div>
  </div>
</template>
