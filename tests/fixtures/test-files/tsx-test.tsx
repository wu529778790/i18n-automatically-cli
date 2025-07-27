import i18n from '@/i18n';
import React, { useState, useEffect, useCallback } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

interface ShoppingCartProps {
  initialProducts?: Product[];
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  initialProducts = [],
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (): Promise<void> => {
    setLoading(true);
    setMessage(i18n.global.t('key_正在加载商品数据_866a1be7'));

    try {
      // 模拟 API 调用
      const mockProducts: Product[] = [
        {
          id: 1,
          name: i18n.global.t('key_苹果手机_a37bf4a7'),
          price: 6999,
          category: i18n.global.t('key_电子产品_cdce861f'),
          inStock: true,
        },
        {
          id: 2,
          name: i18n.global.t('key_笔记本电脑_161783fb'),
          price: 8999,
          category: i18n.global.t('key_电子产品_cdce861f'),
          inStock: true,
        },
        {
          id: 3,
          name: i18n.global.t('key_无线耳机_86f5cb2d'),
          price: 299,
          category: i18n.global.t('key_配件_e98aec0a'),
          inStock: false,
        },
        {
          id: 4,
          name: i18n.global.t('key_智能手表_0c3bd43c'),
          price: 2499,
          category: i18n.global.t('key_可穿戴设备_1a06161b'),
          inStock: true,
        },
      ];

      setProducts(mockProducts);
      setMessage(i18n.global.t('key_商品加载完成_81daca68'));
    } catch (error) {
      setMessage(i18n.global.t('key_商品加载失败请重试_e9fb85d6'));
      console.error(i18n.global.t('key_加载商品时出错_cea086fc'), error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback((product: Product): void => {
    if (!product.inStock) {
      alert(i18n.global.t('key_商品暂时缺货_f1b18b54'));
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    setMessage(`已将 "${product.name}" 加入购物车`);
  }, []);

  const removeFromCart = useCallback((productId: number): void => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    setMessage(i18n.global.t('key_商品已从购物车移除_09c4641b'));
  }, []);

  const updateQuantity = useCallback(
    (productId: number, newQuantity: number): void => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    },
    [removeFromCart]
  );

  const getTotalPrice = (): number => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const checkout = (): void => {
    if (cart.length === 0) {
      alert(i18n.global.t('key_购物车为空无法结账_9d101b93'));
      return;
    }

    const total = getTotalPrice();
    const itemCount = getTotalItems();

    if (
      confirm(`确认购买 ${itemCount} 件商品，总价 ¥${total.toFixed(2)} 吗？`)
    ) {
      setCart([]);
      setMessage(i18n.global.t('key_订单提交成功感谢您的购买_64665828'));
    }
  };

  return (
    <div className="shopping-cart">
      <header className="header">
        <h1>在线商城</h1>
        <div className="cart-summary">购物车 ({getTotalItems()} 件商品)</div>
      </header>

      {loading && <div className="loading">{message}</div>}

      <div className="content">
        <section className="products-section">
          <h2>商品列表</h2>
          {products.length === 0 ? (
            <p>暂无商品</p>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <h3>{product.name}</h3>
                  <p className="price">¥{product.price}</p>
                  <p className="category">分类：{product.category}</p>
                  <p
                    className={`stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}
                  >
                    {product.inStock
                      ? i18n.global.t('key_有库存_7b68d341')
                      : i18n.global.t('key_缺货_14539eef')}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    className="add-to-cart-btn"
                  >
                    {product.inStock
                      ? i18n.global.t('key_加入购物车_62d36990')
                      : i18n.global.t('key_暂时缺货_76d59aee')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="cart-section">
          <h2>购物车</h2>
          {cart.length === 0 ? (
            <p>购物车为空</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <h4>{item.name}</h4>
                    <p>单价：¥{item.price}</p>
                    <div className="quantity-controls">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span>数量：{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <p>小计：¥{(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="remove-btn"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <h3>总计：¥{getTotalPrice().toFixed(2)}</h3>
                <button onClick={checkout} className="checkout-btn">
                  结账
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {message && <div className="message-bar">{message}</div>}
    </div>
  );
};

export default ShoppingCart;
