<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
const route = useRoute(); const router = useRouter(); const auth = useAuthStore();
const current = computed(() => String(route.name ?? 'dashboard'));
const isServiceStaff=computed(()=>['MAKEUP','PHOTOGRAPHER'].includes(auth.profile?.role??''));
const tenantMenu = computed(()=>isServiceStaff.value
  ? [{ name:'orders',label:'我的服务台',icon:'▤'}]
  : [{ name:'dashboard', label:'首页', icon:'⌂' },{ name:'orders',label:'服务订单',icon:'▤'},{ name:'stores',label:'门店管理',icon:'▦'},{ name:'employees',label:'员工管理',icon:'♙' }]);
const disabled = [{label:'选片交付',icon:'◫'},{label:'客户',icon:'♢'},{label:'财务',icon:'¥'},{label:'售后',icon:'◉'}];
async function logout(){ await auth.logout(); await router.replace('/login'); }
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="logo"><span>旅</span><div>旅拍管家<small>TRAVEL PHOTO</small></div></div>
      <nav>
        <template v-if="auth.isSuperAdmin">
          <p>平台管理</p><router-link :class="{active:current==='merchants'}" to="/merchants"><i>▦</i>商家管理</router-link>
        </template>
        <template v-else>
          <p>经营管理</p><router-link v-for="item in tenantMenu" :key="item.name" :class="{active:current===item.name}" :to="{name:item.name}"><i>{{ item.icon }}</i>{{ item.label }}</router-link>
          <template v-if="!isServiceStaff"><p class="group">即将上线</p><a v-for="item in disabled" :key="item.label" class="disabled"><i>{{ item.icon }}</i>{{ item.label }}<em>即将上线</em></a></template>
        </template>
        <template v-if="!isServiceStaff"><p class="group">系统</p><router-link :class="{active:current==='settings'}" to="/settings"><i>⚙</i>系统设置</router-link></template>
      </nav>
      <div class="sidebar-foot"><span class="status-dot" />系统运行正常 <b>v0.1</b></div>
    </aside>
    <section class="workspace">
      <header><div><span class="crumb">{{ auth.isSuperAdmin ? 'SaaS 平台' : isServiceStaff ? '员工服务工作台' : auth.profile?.merchant?.name }}</span></div><div class="account"><span class="bell">•</span><span class="avatar">{{ (auth.profile?.employee?.name || auth.profile?.username || '管').slice(0,1) }}</span><div><b>{{ auth.profile?.employee?.name || auth.profile?.username }}</b><small>{{ auth.isSuperAdmin ? '平台管理员' : isServiceStaff ? (auth.profile?.role==='MAKEUP'?'化妆师':'摄影师') : '商家账号' }}</small></div><button @click="logout">退出</button></div></header>
      <main><router-view /></main>
    </section>
  </div>
</template>

<style scoped>
.shell{display:flex;min-height:100vh}.sidebar{position:fixed;inset:0 auto 0 0;width:226px;background:#fff;border-right:1px solid #e8ebef;display:flex;flex-direction:column;z-index:2}.logo{height:74px;padding:0 24px;display:flex;align-items:center;gap:11px;font-weight:650;font-size:17px;border-bottom:1px solid #f0f1f3}.logo>span{width:35px;height:35px;display:grid;place-items:center;background:#315c4e;color:#f0cb79;border-radius:9px;font-family:serif}.logo small{display:block;font-size:8px;letter-spacing:1.4px;color:#9ba3ae;margin-top:2px}nav{padding:18px 12px;flex:1}nav p{font-size:11px;color:#a1a9b4;padding:0 12px;margin:4px 0 8px;letter-spacing:.8px}nav p.group{margin-top:25px}nav a{position:relative;display:flex;align-items:center;height:43px;padding:0 13px;margin:3px 0;border-radius:8px;text-decoration:none;color:#586476;font-size:14px;cursor:pointer}nav a i{font-style:normal;width:27px;font-size:17px;color:#87919f}nav a.active{background:#e9f1ed;color:#294f43;font-weight:600}nav a.active::before{content:"";position:absolute;left:0;height:22px;width:3px;background:#315c4e;border-radius:2px}nav a.disabled{color:#aeb5bf;cursor:not-allowed}nav a em{font-style:normal;font-size:9px;background:#f0f2f4;color:#a7aeb7;border-radius:8px;padding:2px 5px;margin-left:auto}.sidebar-foot{margin:0 18px 18px;padding-top:15px;border-top:1px solid #eee;font-size:11px;color:#8e98a5}.sidebar-foot b{float:right;font-weight:400}.workspace{margin-left:226px;width:calc(100% - 226px)}header{height:74px;background:#fff;border-bottom:1px solid #e9ecf0;display:flex;align-items:center;justify-content:space-between;padding:0 32px}.crumb{font-size:14px;color:#7c8795}.account{display:flex;align-items:center;gap:10px}.bell{font-size:25px;color:#7e8998;margin-right:11px}.avatar{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#315c4e;color:#fff}.account div{display:flex;flex-direction:column;min-width:70px}.account b{font-size:13px}.account small{font-size:10px;color:#9ba3ad;margin-top:2px}.account button{border:0;background:transparent;color:#8b95a2;cursor:pointer;padding:8px;margin-left:5px}main{min-height:calc(100vh - 74px)}
</style>
