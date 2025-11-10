<template>
  <nav class="top-nav">
    <h1 class="logo" @click="navigateToHome">FinSchool</h1>
    <div class="right-nav">
      <div class="nav-items-desktop">
        <div class="nav-item-with-icon">
          <div class="icon-wrapper">
            <img :src="youtubeIcon" alt="" class="youtube-icon" />
          </div>
          <span class="nav-text">How to Use</span>
        </div>
        <div class="nav-item-button">
          <span class="nav-text">Blogs</span>
        </div>
      </div>
      <div class="nav-menu-tablet">
        <div class="menu-icon-wrapper">
          <img :src="menuIcon" alt="Menu" class="menu-icon" />
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'TopNav',
  data() {
    return {
      youtubeIcon: '/assets/youtube.svg',
      menuIcon: '/assets/menu.svg'
    }
  },
  methods: {
    navigateToHome() {
      if (this.$router) {
        this.$router.push('/')
      }
    }
  }
}
</script>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--token-spacing-12pt) var(--token-spacing-80pt);
  border-bottom: 1px solid var(--token-stroke-green);
  box-sizing: border-box;
}

.logo {
  font-family: var(--font-typeface-display);
  font-weight: 700;
  font-size: var(--font-size-lg);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  margin: 0;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.logo:hover {
  opacity: 0.8;
}

.right-nav {
  display: flex;
  align-items: center;
  gap: var(--token-spacing-4pt);
}

.nav-items-desktop {
  display: flex;
  align-items: center;
  gap: var(--token-spacing-4pt);
}

.nav-menu-tablet {
  display: none;
  align-items: center;
  padding: var(--token-spacing-8pt) 0;
  cursor: pointer;
  box-sizing: border-box;
}

.menu-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.menu-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.nav-item-with-icon {
  display: flex;
  align-items: center;
  gap: var(--token-spacing-4pt);
  padding: var(--token-spacing-8pt) var(--token-spacing-16pt) var(--token-spacing-8pt) 0;
  cursor: pointer;
  box-sizing: border-box;
}

.nav-item-button {
  display: flex;
  align-items: center;
  padding: var(--token-spacing-8pt) 0 var(--token-spacing-8pt) var(--token-spacing-16pt);
  cursor: pointer;
  box-sizing: border-box;
}

.icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.youtube-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.nav-text {
  font-family: var(--font-typeface-body);
  font-weight: 500;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-18);
  color: var(--token-text-primary);
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.nav-text:hover,
.nav-item-with-icon:hover,
.nav-item-button:hover,
.nav-menu-tablet:hover {
  opacity: 0.8;
}

/* Tablet responsive styles - max-width: 640px */
@media (max-width: 640px) {
  .top-nav {
    padding: var(--token-spacing-12pt) var(--token-spacing-40pt);
  }

  .logo {
    font-size: var(--font-size-md);
    line-height: var(--line-height-lg);
  }

  .nav-items-desktop {
    display: none;
  }

  .nav-menu-tablet {
    display: flex;
  }
}

/* Mobile responsive styles - max-width: 430px */
@media (max-width: 430px) {
  .top-nav {
    padding: var(--token-spacing-12pt) var(--token-spacing-20pt);
  }

  .logo {
    font-family: var(--font-typeface-display);
    font-weight: var(--font-weight-700);
    font-size: var(--font-size-md);
    line-height: var(--line-height-lg);
  }
}
</style>

