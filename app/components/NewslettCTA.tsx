"use client";

export default function NewsletterCTA() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Stay Updated with Mingala Mart</h2>
      <p className="mb-6">Sign up for our newsletter to receive the latest deals and product updates.</p>
      <form className="flex flex-col sm:flex-row justify-center gap-4">
        <input
          type="email"
          placeholder="Enter your email"
          className="px-4 py-3 rounded-lg w-full sm:w-80 text-black"
        />
        <button
          type="submit"
          className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
