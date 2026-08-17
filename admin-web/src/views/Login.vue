<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { errorMessage } from '@/api/http';
import { useAuthStore } from '@/stores/auth';

const form = reactive({ username: '', password: '' });
const rules: FormRules = { username: [{ required: true, message: '请输入账号' }], password: [{ required: true, min: 8, message: '密码至少 8 位' }] };
const formRef = ref<FormInstance>(); const loading = ref(false); const router = useRouter(); const auth = useAuthStore();
async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  loading.value = true;
  try { await auth.login(form.username, form.password); await router.replace(auth.isSuperAdmin ? '/merchants' : '/'); }
  catch (error) { ElMessage.error(errorMessage(error)); } finally { loading.value = false; }
}
</script>

<template>
  <main class="login-page">
    <section class="intro">
      <div class="brand"><span class="brand-mark">旅</span><span>旅拍管家</span></div>
      <div class="intro-copy">
        <span class="eyebrow">TRAVEL PHOTO WORKSPACE</span>
        <h1>让每一次拍摄，<br>都有条不紊。</h1>
        <p>为旅拍、婚纱摄影与写真工作室打造的轻量管理平台。</p>
      </div>
      <div class="scene-card"><div class="scene-line"><span>今日流程</span><b>08 / 12</b></div><div class="progress"><i /></div><div class="steps"><span>已预约</span><span>拍摄中</span><span>待交付</span></div></div>
    </section>
    <section class="login-wrap">
      <div class="login-card">
        <div class="mobile-brand"><span class="brand-mark">旅</span>旅拍管家</div>
        <h2>欢迎回来</h2><p>登录你的管理工作台</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
          <el-form-item label="登录账号" prop="username"><el-input v-model="form.username" size="large" placeholder="请输入账号" autocomplete="username" /></el-form-item>
          <el-form-item label="登录密码" prop="password"><el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" autocomplete="current-password" /></el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="submit" @click="submit">登录系统</el-button>
        </el-form>
        <div class="safe"><span>✓</span> 账号数据已加密保护</div>
      </div>
      <footer>© 2026 旅拍管家 · 专注摄影行业数字化</footer>
    </section>
  </main>
</template>

<style scoped>
.login-page { min-height: 100vh; display: grid; grid-template-columns: minmax(520px, 56%) 1fr; background: #fff; }
.intro { position: relative; overflow: hidden; padding: 44px 6vw; color: #fff; background: #23483d; display: flex; flex-direction: column; justify-content: space-between; }
.intro::before { content:""; position:absolute; width:520px; height:520px; right:-170px; top:-150px; border:1px solid rgba(255,255,255,.1); border-radius:50%; box-shadow:0 0 0 80px rgba(255,255,255,.025),0 0 0 160px rgba(255,255,255,.02); }
.brand, .mobile-brand { position: relative; display:flex; align-items:center; gap:12px; font-size:20px; font-weight:650; }
.brand-mark { width:38px; height:38px; display:grid; place-items:center; border-radius:10px; background:#e3b96a; color:#274b40; font-family:serif; font-weight:bold; }
.intro-copy { position:relative; max-width:630px; margin-top:60px; }
.eyebrow { color:#d9c596; letter-spacing:2.2px; font-size:12px; }
.intro h1 { font-size:52px; line-height:1.28; letter-spacing:1px; margin:22px 0; font-weight:600; }
.intro-copy p { color:rgba(255,255,255,.68); font-size:17px; }
.scene-card { position:relative; width:390px; padding:20px 22px; margin-bottom:12px; background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.12); border-radius:14px; backdrop-filter:blur(5px); }
.scene-line, .steps { display:flex; justify-content:space-between; font-size:13px; }.scene-line b{color:#e7ca88}.progress{height:5px;background:rgba(255,255,255,.15);border-radius:4px;margin:15px 0}.progress i{display:block;width:67%;height:100%;background:#e3b96a;border-radius:4px}.steps{color:rgba(255,255,255,.6);font-size:12px}
.login-wrap { display:flex; flex-direction:column; justify-content:center; align-items:center; padding:50px; position:relative; }
.login-card { width:390px; }.mobile-brand{display:none}.login-card h2{font-size:30px;margin:0 0 9px}.login-card>p{color:#8490a1;margin:0 0 34px}.login-card :deep(.el-form-item__label){font-weight:550;color:#334057}.login-card :deep(.el-input__wrapper){border-radius:9px;box-shadow:0 0 0 1px #dfe4e9 inset}.submit{width:100%;margin-top:9px;height:46px;border-radius:9px}.safe{text-align:center;color:#9aa3af;font-size:12px;margin-top:24px}.safe span{color:#4aa17a}footer{position:absolute;bottom:25px;color:#a5adb9;font-size:12px}
@media(max-width:1250px){.intro{padding-left:4vw}.intro h1{font-size:44px}.login-wrap{padding:35px}}
</style>
