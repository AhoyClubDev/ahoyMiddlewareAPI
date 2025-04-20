import Link from 'next/link';

export default function Home() {
  return (
    <div className="font-pp py-8 md:py-16 px-4 md:px-12">
      <div className="flex flex-col gap-8">
        <div className="mt-[52px] flex flex-col items-center justify-center text-center gap-5">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white-800">
            Ahoy API
          </h1>
          <p className="text-lg text-white-600 max-w-2xl">
            Explore our collection of luxury yachts and maritime services.
          </p>
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link 
              href="/yacht"
              className="bg-stone-100 border-8 border-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="h-64 bg-blue-100 flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 20L22 20" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M19.7471 16.3539L19.8778 16.2809C20.9923 15.6281 21.5496 15.3017 21.7747 14.8082C22 14.3147 22 13.7116 22 12.5054V12.5054C22 11.2992 22 10.6961 21.7747 10.2026C21.5496 9.70913 20.9923 9.38272 19.8778 8.72991L19.7471 8.65688C18.6326 8.00407 18.0753 7.67766 17.5376 7.67766C17 7.67766 16.4427 8.00407 15.3282 8.65688L15.1975 8.72991C14.083 9.38272 13.5257 9.70913 13.3006 10.2026C13.0753 10.6961 13.0753 11.2992 13.0753 12.5054V12.5054C13.0753 13.7116 13.0753 14.3147 13.3006 14.8082C13.5257 15.3017 14.083 15.6281 15.1975 16.2809L15.3282 16.3539C16.4427 17.0067 17 17.3331 17.5376 17.3331C18.0753 17.3331 18.6326 17.0067 19.7471 16.3539Z" stroke="#141B34" strokeWidth="1.5"/>
                  <path d="M2 12.5C2 10.2909 3.79086 8.5 6 8.5H9.5" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 16.5H9.5" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M2 8.5L6 4.5L10 8.5" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-medium mb-2 text-gray-800">Yacht Collection</h2>
                <p className="text-gray-600">Browse our extensive collection of luxury yachts available for charter.</p>
              </div>
            </Link>
            
            <Link 
              href="/api-docs"
              className="bg-stone-100 border-8 border-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="h-64 bg-purple-100 flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 17L20 17" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 21L20 21" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 21C4.89543 21 4 20.1046 4 19C4 17.8954 4.89543 17 6 17" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 7L16 7" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 10L13 10" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-medium mb-2 text-gray-800">API Documentation</h2>
                <p className="text-gray-600">Explore our API endpoints and learn how to integrate with our services.</p>
              </div>
            </Link>
          </div>
          
          {/* <div className="mt-12">
            <Link 
              href="https://github.com/APS4087/ahoy-api"
              className="px-6 py-3 font-medium bg-[--button] text-[--button-text] rounded-full text-lg hover:bg-[--button-sec]" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View on GitHub
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
