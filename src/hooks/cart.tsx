import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { ScreenStackHeaderLeftView } from 'react-native-screens';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStoage = await AsyncStorage.getItem(
        '@GoMarketplace/products',
      );

      if (productsFromStoage) {
        setProducts([...JSON.parse(productsFromStoage)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace/products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let newProducts = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity - 1 } : p,
      );

      newProducts = newProducts.filter(p => p.quantity > 0);

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace/products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);
      if (productExists) {
        increment(productExists.id);
      } else {
        const newProducts = [...products, { ...product, quantity: 1 }];

        setProducts(newProducts);

        await AsyncStorage.setItem(
          '@GoMarketplace/products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
