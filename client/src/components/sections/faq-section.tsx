"use client";

import { useState } from "react";
import Image from "next/image";
import images from "@/assets/images";
import { brandConfig } from "@/config/brand";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { IconMinusCircle, IconPlusCircle } from "../ui/icons";

export default function FaqSection() {
  const router = useRouter();
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  return (
    <div id="faq" className="py-16 space-y-20 w-full">
      {/* Title */}
      <div className="mx-auto max-w-2xl flex flex-col justify-center items-center sm:text-center">
        <h1 className="text-2xl text-gray-900 dark:text-white text-center font-semibold sm:text-3xl xl:text-[40px] relative">
          Frequently asked <span className="text-brand-600">questions.</span>
          <svg
            width="100"
            height="29"
            viewBox="0 0 307 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute -bottom-7 right-0"
          >
            <path
              d="M213.014 26.8415C178.272 19.4138 139.489 23.4441 104.338 24.1263C94.2307 24.3226 83.8895 25.6318 73.7918 25.0712C72.4748 24.9984 66.7288 24.7252 65.6509 23.2654C65.5102 23.0755 69.9908 22.3264 72.1676 22.006C76.4002 21.3829 80.6309 20.9232 84.86 20.2652C95.9785 18.5363 107.291 17.6927 118.507 16.9156C147.298 14.9223 198.803 8.77966 226.942 17.4422C228.336 17.8714 224.026 17.3684 222.568 17.3285C220.172 17.2635 217.778 17.1695 215.381 17.0942C207.566 16.8496 199.685 16.4146 191.869 16.483C166.68 16.702 141.403 15.6497 116.221 16.5922C108.643 16.8762 101.09 17.4658 93.5093 17.6937C89.1182 17.8256 89.315 17.9373 84.7768 17.7833C82.8091 17.7163 77.3531 18.3084 78.9093 17.1021C81.6501 14.9769 90.2167 15.5085 93.5299 15.0749C108.658 13.0974 123.749 10.515 138.954 9.1276C177.942 5.57026 217.632 5.56189 256.709 7.05018C272.694 7.65899 288.845 5.30402 304.762 7.20672C266.14 2.21866 225.996 2.92687 187.163 3.07107C143.44 3.23349 99.7666 3.24431 56.043 4.16564C38.0928 4.54362 20.5048 7.96207 2.5 7.71255"
              stroke="#7B39ED"
              strokeWidth="4.05049"
              strokeMiterlimit="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 text-center">
          Everything you need to know about the product and billing.
        </p>
      </div>

      {/* Questions and answers */}
      <div className="px-4 max-w-3xl mx-auto w-full">
        <div className="divide-y border-y dark:border-y-gray-800 dark:divide-gray-800">
          {brandConfig.faq.map((f, i) => (
            <div key={i} className="flex py-8 flex-1 space-x-1">
              <div className="flex-grow">
                <h2 className="text-lg h-7 font-medium text-gray-700 dark:text-gray-400">
                  {f.question}
                </h2>
                {openFaqId === i && <p className="text-gray-600 dark:text-gray-300">{f.answer}</p>}
              </div>

              <div>
                {openFaqId === i ? (
                  <button className="py-0.5" onClick={() => setOpenFaqId(null)}>
                    <IconMinusCircle className="h-6 w-6" />
                  </button>
                ) : (
                  <button className="py-0.5" onClick={() => setOpenFaqId(i)}>
                    <IconPlusCircle className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact us */}
      <div className="max-w-3xl w-full mx-auto px-4">
        <div className="bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:border max-w-6xl mx-auto rounded-2xl space-y-6 px-6 py-8">
          {/* Team avatars */}
          <div className="flex items-baseline justify-center">
            <Image
              src={images.AvatarSticker04}
              height={40}
              width={40}
              className="inline-block rounded-full border border-white"
              alt="Avatar"
            />
            <Image
              src={images.AvatarSticker02}
              height={56}
              width={56}
              className="inline-block rounded-full -ml-4 z-10 border border-white"
              alt="Avatar"
            />
            <Image
              src={images.AvatarSticker05}
              height={40}
              width={40}
              className="inline-block rounded-full -ml-4 border border-white"
              alt="Avatar"
            />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Still have questions?
            </h1>
            <p className="md:text-base text-gray-600 dark:text-gray-300">
              Can’t find the answer you’re looking for? Please chat to our
              friendly team.
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => router.push("/contact")}
              variant="primary"
              className="mx-auto"
            >
              Get in touch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
