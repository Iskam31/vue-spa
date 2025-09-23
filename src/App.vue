<template>
  <div id="app">
    <header>
      <nav>
        <RouterLink to="/incomes">Доходы</RouterLink> |
        <RouterLink to="/orders">Заказы</RouterLink> |
        <RouterLink to="/sales">Продажи</RouterLink> |
        <RouterLink to="/stocks">Склады</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  padding: 0;
  margin: 0;
}

header {
  background: #35495e;
  padding: 10px;
}

nav {
  display: flex;
  gap: 15px;
}

nav a {
  color: #fff;
  text-decoration: none;
}

nav a.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
}

main {
  padding: 20px;
}
</style>