"use client";

import { useEffect, useState } from "react";
import { capitalizeFirstLetter } from "~~/utils/common/common";
import {
  DappRating,
  DappRegistered,
  fetchDappRatings,
  fetchGraphQLRegisteredDapps,
} from "~~/utils/graphQL/fetchFromSubgraph";

const DisplayReviews = () => {
  const [reviews, setReviews] = useState<DappRating[]>([]);
  const [dapps, setDapps] = useState<DappRegistered[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch reviews
        const reviewsResponse = await fetchDappRatings();
        if (reviewsResponse && reviewsResponse.data) {
          setReviews(reviewsResponse.data.dappRatingSubmitteds.reverse());
        }

        // Fetch registered dapps
        const dappsResponse = await fetchGraphQLRegisteredDapps();
        if (dappsResponse && dappsResponse.data) {
          setDapps(dappsResponse.data.dappRegistereds);
        }

        setError(null);
      } catch (err) {
        setError(`An error occurred while fetching data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderStars = (averageRating: number) => {
    const roundedRating = Math.round(averageRating);
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < roundedRating ? "gold" : "grey", fontSize: "24px" }}>
        ★
      </span>
    ));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  // Create a mapping from dappId to dapp name
  const dappIdToNameMap = dapps.reduce((map, dapp) => {
    map[dapp.dappId] = dapp.name;
    return map;
  }, {} as Record<string, string>);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center text-4xl font-bold" style={{ color: "#7e5bc2" }}>
            Rate your experience with Web3!
          </h1>
          <div className="text-center margin-top-20">
            <p className="block text-2xl my-2 font-medium">Search for project&apos;s reviews:</p>
            <div className="flex justify-center items-center mt-4">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-2 border-2 rounded focus:outline-none focus:border-[#7e5bc2] shadow"
                style={{ borderColor: "#7e5bc2", boxShadow: `0 0 5px #7e5bc2` }}
              />
            </div>
          </div>
        </div>

        {/* Display area for Reviews */}
        <div className="w-full px-5 mt-6">
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews
                .filter(review => dappIdToNameMap[review.dappId]?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((review, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow flex flex-col items-center"
                  >
                    <h3 className="font-semibold text-lg text-center" style={{ color: "#7e5bc2" }}>
                      {capitalizeFirstLetter(dappIdToNameMap[review.dappId]) || "Unknown App"}
                    </h3>
                    <div className="text-[#FFD700]">{renderStars(review.starRating)}</div>
                    <p className="text-center mt-2">{review.reviewText}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center mt-4">No reviews found.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default DisplayReviews;
