import Link from "next/link";

const Footer = () => {
  return (
      <section className="bg-blue-600 text-white rounded-lg p-12 text-center shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Ready to start shopping?</h2>
        <p className="mb-6 text-lg">
          Explore thousands of products and get the best deals today!
        </p>
        <Link
          href="/products"
          className="bg-white text-blue-700 px-8 py-3 rounded-lg shadow font-semibold hover:bg-gray-100 transition"
        >
          Start Shopping →
        </Link>
      </section>
  )
}

export default Footer