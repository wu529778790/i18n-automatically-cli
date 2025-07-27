<template>
  <div class="product-list">
    <h1>{{ $t('key_商品列表_43797485') }}</h1>
    <div class="search-bar">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="{{ $t('key_请输入商品名称_d8318796') }}"
        @input="handleSearch" />
      <button @click="clearSearch">{{ $t('key_清空_288f0c40') }}</button>
    </div>

    <div v-if="loading" class="loading">{{ $t('key_加载中_f013ea9d') }}，{{ $t('key_请稍候_7c1efe79') }}...</div>

    <div v-else-if="products.length === 0" class="empty">{{ $t('key_暂无商品数据_bbf60384') }}</div>

    <div v-else class="product-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-item">
        <img :src="product.image" :alt="product.name" />
        <h3>{{ product.name }}</h3>
        <p class="price">{{ $t('key_价格_0e9fd989') }}：￥{{ product.price }}</p>
        <p class="description">{{ product.description }}</p>
        <div class="actions">
          <button @click="addToCart(product)">{{ $t('key_加入购物车_62d36990') }}</button>
          <button @click="buyNow(product)">{{ $t('key_立即购买_5fd2f9b1') }}</button>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">{{ $t('key_上一页_f4f85316') }}</button>
      <span>{{ $t('key_第_ac007746') }} {{ currentPage }} {{ $t('key_页_5fccd018') }}，{{ $t('key_共_fbd2b1fb') }} {{ totalPages }} {{ $t('key_页_5fccd018') }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        {{ $t('key_下一页_b4e1b508') }}
      </button>
    </div>
  </div>
</template>

<script>import i18n from '@/i18n';

import { ref, computed, onMounted } from 'vue';

export default {
  name: 'ProductList',
  setup() {
    const products = ref([]);
    const loading = ref(false);
    const searchKeyword = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);

    const filteredProducts = computed(() => {
      if (!searchKeyword.value) return products.value;
      return products.value.filter((product) =>
        product.name.includes(searchKeyword.value)
      );
    });

    const totalPages = computed(() => {
      return Math.ceil(filteredProducts.value.length / pageSize.value);
    });

    const loadProducts = async () => {
      loading.value = true;
      try {
        // 模拟 API 调用
        const response = await fetch('/api/products');
        products.value = await response.json();
      } catch (error) {
        console.error(
          i18n.global.t(i18n.global.t('key_key加载商品失败09bce89f_802c0733')),
          error
        );
        alert(
          i18n.global.t(
            i18n.global.t('key_key商品加载失败请重试e9fb85d6_b43d4589')
          )
        );
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      currentPage.value = 1;
    };

    const clearSearch = () => {
      searchKeyword.value = '';
      currentPage.value = 1;
    };

    const addToCart = (product) => {
      alert(`已将 "${product.name}" 加入购物车`);
    };

    const buyNow = (product) => {
      if (confirm(`确认购买 "${product.name}" 吗？`)) {
        alert(
          i18n.global.t(i18n.global.t('key_key跳转到支付页面3b438114_5a2e1594'))
        );
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    onMounted(() => {
      loadProducts();
    });

    return {
      products,
      loading,
      searchKeyword,
      currentPage,
      filteredProducts,
      totalPages,
      handleSearch,
      clearSearch,
      addToCart,
      buyNow,
      prevPage,
      nextPage,
    };
  },
};
</script>

<style scoped>
.product-list {
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}

.pagination button {
  margin: 0 10px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
