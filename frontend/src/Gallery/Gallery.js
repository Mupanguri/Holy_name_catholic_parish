import React from 'react';
import GlobalTheme from '../components/GlobalTheme';

const Gallery = () => {
  return (
    <GlobalTheme>
      <div className="hn-parchment-page">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="hn-parchment-container">
            <div className="hn-parchment-bar"></div>
            <div className="relative p-6">
              <h1 className="hn-section-heading">Gallery</h1>
              <p className="hn-section-sub">Featured Images from Holy Name Parish</p>
              <div className="gallery-container max-w-[1200px] mx-auto py-4 px-4">
                <div className="flex justify-center py-6">
                  <figure className="w-full max-w-sm sm:max-w-sm md:max-w-sm lg:max-w-md xl:max-w-lg">
                    <img
                      src={process.env.PUBLIC_URL + '/images/15.jpg'}
                      alt="Sacred Heart Guild"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                    <figcaption className="text-center mt-2 text-m text-gray-600">
                      The Bishop of the Archdiocese of Harare Rev Robert Christopher Ndlovu, Fr J
                      Ndhlalambi, Fr G Jingisoni and the Mass Servers
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalTheme>
  );
};

export default Gallery;
