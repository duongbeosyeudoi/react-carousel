import { Carousel } from "./components/Carousel/Carousel";
import { CarouselItem } from "./types/carousel";
import "./styles/index.css";

const sampleData: CarouselItem[] = [
  {
    id: 1,
    title: "Slide 1",
    image: "https://picsum.photos/id/1015/300/300",
    landing_page: "https://landingpage1.com",
  },
  {
    id: 2,
    title: "Slide 2",
    image: "https://picsum.photos/id/1016/300/300",
    landing_page: "https://landingpage2.com",
  },
  {
    id: 3,
    title: "Slide 3",
    image: "https://picsum.photos/id/1018/300/300",
    landing_page: "https://landingpage3.com",
  },
  {
    id: 4,
    title: "Slide 4",
    image: "https://picsum.photos/id/1019/300/300",
    landing_page: "https://landingpage4.com",
  },
  {
    id: 5,
    title: "Slide 5",
    image: "https://picsum.photos/id/1020/300/300",
    landing_page: "https://landingpage5.com",
  },
  {
    id: 6,
    title: "Slide 6",
    image: "https://picsum.photos/id/1021/300/300",
    landing_page: "https://landingpage6.com",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Carousel Component Demo
          </h1>
        </header>

        <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 mb-8">
          <Carousel items={sampleData} size="1/3" spacing={16} />
        </div>
      </div>
    </div>
  );
}

export default App;
