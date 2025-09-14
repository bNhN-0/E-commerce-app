"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  const router = useRouter();

  // Get logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Fetch cart items & addresses
  useEffect(() => {
    if (!user) return;

    const fetchCartAndAddresses = async () => {
      // Fetch cart
      const { data: cart } = await supabase
        .from("carts")
        .select(`id, cart_items (*, product:product_id(*))`)
        .eq("user_id", user.id)
        .single();

      setCartItems(cart?.cart_items || []);

      // Fetch addresses
      const { data: userAddresses } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id);

      setAddresses(userAddresses || []);
      if (userAddresses?.length) setSelectedAddress(userAddresses[0].id);
    };

    fetchCartAndAddresses();
  }, [user]);

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountedTotal = total * (1 - discountPercent / 100);

  // Apply coupon
  const applyCoupon = async () => {
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .gte("valid_until", new Date())
      .single();

    if (error || !coupon) {
      alert("Invalid or expired coupon");
      setDiscountPercent(0);
    } else {
      setDiscountPercent(coupon.discount_percent);
      alert(`Coupon applied! ${coupon.discount_percent}% off`);
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!selectedAddress) return alert("Select an address!");

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        address_id: selectedAddress,
        total: discountedTotal,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) return alert(orderError.message);

    // Insert order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    await supabase.from("order_items").insert(orderItems);

    // Clear cart
    await supabase.from("cart_items").delete().eq("cart_id", cartItems[0]?.cart_id);

    alert("Order placed successfully!");
    router.push("/orders"); // redirect to order history
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🛒 Checkout</h1>

      <h2 className="font-semibold">Select Shipping Address</h2>
      <select
        value={selectedAddress || ""}
        onChange={(e) => setSelectedAddress(Number(e.target.value))}
        className="border p-2 mb-4"
      >
        {addresses.map((addr) => (
          <option key={addr.id} value={addr.id}>
            {addr.full_name}, {addr.street}, {addr.city}
          </option>
        ))}
      </select>

      <h2 className="font-semibold">Apply Coupon</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Coupon code"
          className="border p-2"
        />
        <button onClick={applyCoupon} className="bg-green-500 text-white px-3 py-1 rounded">
          Apply
        </button>
      </div>

      <h2 className="font-semibold">Order Summary</h2>
      <ul className="mb-4">
        {cartItems.map((item) => (
          <li key={item.id}>
            {item.product.name} x {item.quantity} - ${item.product.price * item.quantity}
          </li>
        ))}
      </ul>

      <p className="mb-4">
        Total: ${total.toFixed(2)} <br />
        Discount: {discountPercent}% <br />
        <strong>Payable: ${discountedTotal.toFixed(2)}</strong>
      </p>

      <button onClick={placeOrder} className="bg-blue-500 text-white px-4 py-2 rounded">
        Place Order
      </button>
    </div>
  );
}
