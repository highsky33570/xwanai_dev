"use client"

export default function Footer() {
  return (
    <footer className="w-full border-t flex-shrink-0" style={{
      borderTopColor: '#e5e7eb',
      backgroundColor: '#f6f6f7'
    }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-gray-900 text-lg font-semibold mb-3">About</h3>
            <p className="text-gray-600 text-sm">AI character interaction platform.</p>
          </div>
          <div>
            <h3 className="text-gray-900 text-lg font-semibold mb-3">Features</h3>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>Character Database</li>
              <li>AI Chat</li>
              <li>Custom Characters</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 text-lg font-semibold mb-3">Support</h3>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 text-lg font-semibold mb-3">Contact</h3>
            <button className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700">CONTACT  gjmb@hyper.com</button>
          </div>
        </div>
        <div className="border-t border-gray-300 mt-8 pt-4">
          <p className="text-gray-500 text-sm text-center">© 2025 XWAN.IO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
