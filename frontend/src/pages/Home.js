import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-garba-yellow mb-6 font-display">
          Welcome to Garba Gravity
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Experience the vibrant energy of Garba with your exclusive digital pass. 
          Register now to secure your spot at the most anticipated cultural event of the year!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
            <div className="text-garba-orange text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-bold text-white mb-2">Live Performances</h3>
            <p className="text-gray-300">Experience electrifying performances by renowned artists</p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
            <div className="text-garba-orange text-4xl mb-4">💃</div>
            <h3 className="text-xl font-bold text-white mb-2">Dance Workshops</h3>
            <p className="text-gray-300">Learn traditional Garba steps from professional dancers</p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
            <div className="text-garba-orange text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-bold text-white mb-2">Cultural Showcase</h3>
            <p className="text-gray-300">Immerse yourself in rich cultural performances</p>
          </div>
        </div>
        
        <div className="mt-16">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-garba-dark bg-garba-yellow hover:bg-opacity-90 md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
          >
            Get Your Garba Pass Now
            <ArrowRightIcon className="ml-3 -mr-1 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
