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
    setMessage(
      i18n.global.t(i18n.global.t('key_key正在加载商品数据866a1be7_665dd09c'))
    );

    try {
      // 模拟 API 调用
      const mockProducts: Product[] = [
        {
          id: 1,
          name: i18n.global.t(
            i18n.global.t('key_key苹果手机a37bf4a7_7143441c')
          ),
          price: 6999,
          category: i18n.global.t(
            i18n.global.t('key_key电子产品cdce861f_12fd31ba')
          ),
          inStock: true,
        },
        {
          id: 2,
          name: i18n.global.t(
            i18n.global.t('key_key笔记本电脑161783fb_8663e0bf')
          ),
          price: 8999,
          category: i18n.global.t(
            i18n.global.t('key_key电子产品cdce861f_12fd31ba')
          ),
          inStock: true,
        },
        {
          id: 3,
          name: i18n.global.t(
            i18n.global.t('key_key无线耳机86f5cb2d_3ddbc237')
          ),
          price: 299,
          category: i18n.global.t(
            i18n.global.t('key_key配件e98aec0a_4e2a7438')
          ),
          inStock: false,
        },
        {
          id: 4,
          name: i18n.global.t(
            i18n.global.t('key_key智能手表0c3bd43c_d2b86b5d')
          ),
          price: 2499,
          category: i18n.global.t(
            i18n.global.t('key_key可穿戴设备1a06161b_6e1923c6')
          ),
          inStock: true,
        },
      ];

      setProducts(mockProducts);
      setMessage(
        i18n.global.t(i18n.global.t('key_key商品加载完成81daca68_b84b4cba'))
      );
    } catch (error) {
      setMessage(
        i18n.global.t(
          i18n.global.t('key_key商品加载失败请重试e9fb85d6_b43d4589')
        )
      );
      console.error(
        i18n.global.t(i18n.global.t('key_key加载商品时出错cea086fc_ffe089b2')),
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback((product: Product): void => {
    if (!product.inStock) {
      alert(
        i18n.global.t(i18n.global.t('key_key商品暂时缺货f1b18b54_74367d40'))
      );
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
    setMessage(
      i18n.global.t(i18n.global.t('key_key商品已从购物车移除09c4641b_f2b86f2d'))
    );
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
      alert(
        i18n.global.t(
          i18n.global.t('key_key购物车为空无法结账9d101b93_11940f3b')
        )
      );
      return;
    }

    const total = getTotalPrice();
    const itemCount = getTotalItems();

    if (
      confirm(`确认购买 ${itemCount} 件商品，总价 ¥${total.toFixed(2)} 吗？`)
    ) {
      setCart([]);
      setMessage(
        i18n.global.t(
          i18n.global.t('key_key订单提交成功感谢您的购买64665_e198cbfe')
        )
      );
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
                      ? i18n.global.t(
                          i18n.global.t('key_key有库存7b68d341_139ddef8')
                        )
                      : i18n.global.t(
                          i18n.global.t('key_key缺货14539eef_d72208a7')
                        )}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    className="add-to-cart-btn"
                  >
                    {product.inStock
                      ? i18n.global.t(
                          i18n.global.t('key_key加入购物车62d36990_aa431d03')
                        )
                      : i18n.global.t(
                          i18n.global.t('key_key暂时缺货76d59aee_66a8986c')
                        )}
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
