import { useState } from "react";

type Props = {
  // title?: string
  images: any[]
}

const activeImageClass = "translate-x-0 z-20";
const otherImagesClass = "translate-x-full z-10";

const activePointClass = "bg-white dark:bg-gray-800";
const otherPointsClass = "bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800";

const ImageViewer = (props: Props) => {
  const { images } = props;
  const [ currentImageIndex, setCurrentImageIndex ] = useState(0);
  const imagesLength = images?.length;
  const hasImages = imagesLength > 0;

  const nextImage = () => {
    setCurrentImageIndex((prevIndex => {
      let nextIndex = prevIndex + 1;
      if (nextIndex >= imagesLength) {
        nextIndex = 0;
      }
      return nextIndex;
    }))
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex => {
      let nextIndex = prevIndex - 1;
      if (nextIndex < 0) {
        nextIndex = imagesLength - 1;
      }
      return nextIndex;
    }))
  }
  
  return (
    <div id="default-carousel" className="relative" data-carousel="static">
      <div className="relative h-56 overflow-hidden rounded-lg md:h-96 flex justify-center items-center">
        {hasImages ? images.map((img, i) => (
          <div className={`duration-700 ease-in-out absolute inset-0 transition-all transform ${currentImageIndex === i ? activeImageClass : otherImagesClass}`} data-carousel-item={String(currentImageIndex)}>
            <img src={img} className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..." />
          </div>
          ))
        :
          <h3 className=" text-lg">لا يوجد</h3>
        }
      </div>

      <div className="absolute z-30 flex space-x-3 -translate-x-1/2 bottom-5 left-1/2">
        {images.map((_, i) => (
          <button type="button" className={`w-3 h-3 rounded-full ${currentImageIndex === i ? activePointClass : otherPointsClass}`} aria-current={currentImageIndex === i ? 'true' : 'false'} aria-label={'Slide' + i} data-carousel-slide-to={i + 1}></button>
        ))}
      </div>

      <button onClick={prevImage} type="button" className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev={currentImageIndex - 1}>
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full sm:w-10 sm:h-10 bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
          <svg aria-hidden="true" className="w-5 h-5 text-white sm:w-6 sm:h-6 dark:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          <span className="sr-only">Previous</span>
        </span>
      </button>
      <button onClick={nextImage} type="button" className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next={currentImageIndex + 1}>
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full sm:w-10 sm:h-10 bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
          <svg aria-hidden="true" className="w-5 h-5 text-white sm:w-6 sm:h-6 dark:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          <span className="sr-only">Next</span>
        </span>
      </button>
    </div>
  )
}

export default ImageViewer;
