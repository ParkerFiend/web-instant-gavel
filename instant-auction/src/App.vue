<script setup lang="ts">
import { usePlayerStore } from './stores/playerStore'
import { formatMoney } from './utils/format'

const player = usePlayerStore()
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        即刻落槌
        <small>异环 · 本地复刻</small>
      </div>
      <nav class="navlinks">
        <RouterLink class="navlink" to="/">主页</RouterLink>
        <RouterLink class="navlink" to="/venue">进入会场</RouterLink>
        <RouterLink class="navlink" to="/book">藏品图鉴</RouterLink>
        <span class="money-chip">
          💰 {{ formatMoney(player.currency) }}
          <span class="unit">金贝铢</span>
        </span>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>