<template>
  <div id="app">
    <header>
      <nav class="navbar">
        <RouterLink to="/main">Главная</RouterLink>
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

.navbar {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: start;
  justify-content: start;
}

.navbar a {
  text-decoration: none;
  color: #9e9e9e;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.navbar a:hover {
  background-color: #f5f5f5;
}

.navbar a.router-link-active {
  color: #ffffff;
  font-weight: 500;
}
.navbar a.router-link-active:hover {
  color: #9e9e9e;
  font-weight: 500;
}

@media (max-width: 500px) {
  .navbar {
    gap: 2px;
    row-gap: 2px;
  }

  .navbar a {
    padding: 6px 10px;
    font-size: 14px;
    flex: 1;
    min-width: 0;
    text-align: center;
  }
}

main {
  padding: 20px;
}
</style>