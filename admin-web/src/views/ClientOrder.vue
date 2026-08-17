<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import api,{errorMessage} from '@/api/http';
import type { Order, OrderStatus, ValueAddedService } from '@/types';

const route=useRoute(),loading=ref(true),order=ref<Order|null>(null);
const statusLabels:Record<OrderStatus,string>={
  PENDING_CONFIRMATION:'订单已提交，等待门店确认',WAITING_MAKEUP:'等待化妆师认领',MAKEUP_IN_PROGRESS:'正在进行化妆服务',
  WAITING_PHOTOGRAPHY:'化妆完成，等待摄影师认领',PHOTOGRAPHY_IN_PROGRESS:'正在进行摄影服务',
  WAITING_SELECTION:'拍摄完成，请确认外部选片',WAITING_RETOUCH:'选片已确认，等待后期修片',COMPLETED:'照片已交付',CANCELLED:'订单已取消',
};
const token=String(route.params.token);
const currentStep=computed(()=>{
  const status=order.value?.status;
  if(!status||status==='PENDING_CONFIRMATION')return 0;
  if(['WAITING_MAKEUP','MAKEUP_IN_PROGRESS'].includes(status))return 1;
  if(['WAITING_PHOTOGRAPHY','PHOTOGRAPHY_IN_PROGRESS'].includes(status))return 2;
  if(status==='WAITING_SELECTION')return 3;
  return 4;
});
async function load(){try{order.value=(await api.get<Order>(`/client/orders/${token}`)).data}catch(e){ElMessage.error(errorMessage(e))}finally{loading.value=false}}
async function confirm(item:ValueAddedService){try{await ElMessageBox.confirm(`确认“${item.name}”服务，共 ¥${item.totalAmount}？确认后将作为服务及业绩记录。`,'确认增值服务',{confirmButtonText:'确认无误',cancelButtonText:'暂不确认',type:'warning'});order.value=(await api.post<Order>(`/client/orders/${token}/value-added/${item.id}/confirm`)).data;ElMessage.success('确认成功')}catch(e){if(e!=='cancel'&&e!=='close')ElMessage.error(errorMessage(e))}}
async function dispute(item:ValueAddedService){try{const {value}=await ElMessageBox.prompt('请说明有异议的原因，服务人员会与您核对。','提交异议',{confirmButtonText:'提交',cancelButtonText:'取消',inputValidator:v=>Boolean(v?.trim())||'请填写原因'});order.value=(await api.post<Order>(`/client/orders/${token}/value-added/${item.id}/dispute`,{reason:value})).data;ElMessage.success('异议已提交')}catch(e){if(e!=='cancel'&&e!=='close')ElMessage.error(errorMessage(e))}}
async function confirmSelection(){try{await ElMessageBox.confirm('请确认您已经在门店指定的选片软件中完成选片。','确认选片完成',{confirmButtonText:'确认已完成',cancelButtonText:'暂不确认',type:'success'});order.value=(await api.post<Order>(`/client/orders/${token}/selection-confirm`)).data;ElMessage.success('选片已确认，订单已进入后期修片')}catch(e){if(e!=='cancel'&&e!=='close')ElMessage.error(errorMessage(e))}}
onMounted(load);
</script>

<template>
  <div v-loading="loading" class="client-page">
    <template v-if="order">
      <header class="top"><div><small>{{order.store.name}}</small><h1>您好，{{order.customer.name}}</h1><p>{{statusLabels[order.status]}}</p></div><span>旅</span></header>
      <main>
        <section class="order-info"><div><small>订单编号</small><b>{{order.orderNo}}</b></div><div><small>预约时间</small><b>{{order.appointmentAt?.slice(0,16).replace('T',' ')||'门店稍后确认'}}</b></div><div><small>服务套餐</small><b>{{order.packageName||'到店确认'}}</b></div></section>
        <section class="client-card">
          <h2>服务进度</h2>
          <div class="steps"><div v-for="(label,index) in ['门店确认','化妆服务','摄影服务','外部选片','后期交付']" :key="label" :class="{done:index<currentStep,active:index===currentStep}"><i>{{index<currentStep?'✓':index+1}}</i><span>{{label}}</span></div></div>
          <div class="workers"><div v-for="record in order.serviceRecords.filter(r=>r.isCurrent)" :key="record.id"><span>{{record.stage==='MAKEUP'?'化妆师':'摄影师'}}</span><b>{{record.employee.name}}</b><small>{{record.status==='COMPLETED'?'服务已完成':record.status==='IN_PROGRESS'?'服务进行中':'已认领'}}</small></div></div>
        </section>
        <section class="client-card">
          <div class="section-title"><h2>增值服务确认</h2><span>{{order.valueAddedServices.filter(i=>i.status==='PENDING').length}} 项待确认</span></div>
          <el-empty v-if="!order.valueAddedServices.length" description="暂无增值服务" :image-size="70"/>
          <article v-for="item in order.valueAddedServices" :key="item.id" class="add-item"><div><small>{{item.stage==='MAKEUP'?'化妆增值':'摄影增值'}} · {{item.employee.name}}</small><h3>{{item.name}} × {{item.quantity}}</h3><p>{{item.description||'服务人员未填写说明'}}</p><em v-if="item.customerNote">异议：{{item.customerNote}}</em></div><aside><b>¥{{item.totalAmount}}</b><template v-if="item.status==='PENDING'"><el-button type="primary" size="small" @click="confirm(item)">确认</el-button><el-button size="small" @click="dispute(item)">有异议</el-button></template><el-tag v-else :type="item.status==='CONFIRMED'?'success':'warning'">{{item.status==='CONFIRMED'?'已确认':'有异议'}}</el-tag></aside></article>
        </section>
        <section v-if="order.status==='WAITING_SELECTION'||order.status==='WAITING_RETOUCH'" class="client-card photo">
          <span>选</span><h2>外部软件选片</h2>
          <p v-if="order.status==='WAITING_SELECTION'">请先在门店指定的选片软件中完成选片。本系统不重复提供选片功能，完成后直接在这里确认即可。</p>
          <p v-else>您已确认完成选片，门店正在安排后期修片。精修照片满意后，才会开放高清文件下载。</p>
          <el-button v-if="order.status==='WAITING_SELECTION'" type="primary" size="large" @click="confirmSelection">确认已完成选片</el-button>
          <el-tag v-else type="success" size="large">已确认 · 等待后期修片</el-tag>
        </section>
        <p class="help">如有问题，请联系 {{order.store.name}}</p>
      </main>
    </template>
  </div>
</template>

<style scoped>
.client-page{position:fixed;inset:0;overflow:auto;z-index:100;background:#f3f6f5;color:#20362f}.top{background:#315c4e;color:#fff;padding:28px 22px 58px;display:flex;justify-content:space-between}.top small{color:#bdd1c9}.top h1{font-size:24px;margin:8px 0}.top p{margin:0;color:#dbe8e3;font-size:13px}.top>span{width:42px;height:42px;border:1px solid #6c8c80;border-radius:12px;display:grid;place-items:center;color:#efcd7c;font-family:serif}.client-page main{max-width:560px;margin:-34px auto 0;padding:0 16px 30px}.order-info,.client-card{background:#fff;border-radius:16px;box-shadow:0 7px 24px rgba(26,56,45,.06)}.order-info{display:grid;grid-template-columns:1.3fr 1fr 1fr;padding:17px;margin-bottom:14px;gap:8px}.order-info div{display:flex;flex-direction:column;min-width:0}.order-info small{font-size:10px;color:#99a39f;margin-bottom:5px}.order-info b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.client-card{padding:20px;margin-bottom:14px}.client-card h2{font-size:16px;margin:0 0 18px}.steps{display:flex;justify-content:space-between;position:relative}.steps:before{content:"";height:2px;background:#e7ecea;position:absolute;left:24px;right:24px;top:13px}.steps div{z-index:1;display:flex;flex-direction:column;align-items:center;gap:6px;color:#9da6a2;font-size:10px}.steps i{font-style:normal;width:28px;height:28px;border-radius:50%;background:#e9edeb;display:grid;place-items:center}.steps .active,.steps .done{color:#315c4e}.steps .active i,.steps .done i{background:#315c4e;color:#fff}.workers{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.workers div{background:#f6f8f7;border-radius:10px;padding:11px;display:grid}.workers span,.workers small{font-size:10px;color:#8c9893}.workers b{font-size:13px;margin:3px 0}.section-title{display:flex;justify-content:space-between}.section-title span{font-size:11px;color:#a47b35}.add-item{display:flex;justify-content:space-between;padding:15px 0;border-top:1px solid #edf0ef}.add-item>div{min-width:0}.add-item small{color:#88938e}.add-item h3{font-size:14px;margin:6px 0}.add-item p{font-size:11px;color:#87918d;margin:0}.add-item em{display:block;font-style:normal;color:#bd743c;font-size:11px;margin-top:6px}.add-item aside{display:flex;flex-direction:column;align-items:flex-end;gap:7px;margin-left:12px}.add-item aside b{color:#a06e20}.add-item .el-button+.el-button{margin-left:0}.photo{text-align:center}.photo>span{display:grid;place-items:center;width:44px;height:44px;margin:0 auto 12px;border-radius:13px;background:#e7f0ec;color:#315c4e;font-size:20px;font-weight:700}.photo p{font-size:12px;color:#7d8984;line-height:1.7;margin-bottom:16px}.help{text-align:center;color:#9ba5a1;font-size:11px}
</style>
