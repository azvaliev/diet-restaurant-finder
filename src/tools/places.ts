import { env } from "../env.ts";
import {
  PlacesClient as GoogleMapsPlacesClient,
  protos,
} from "@googlemaps/places";
import { tool } from "ai";
import { z } from "zod";

const PriceLevelSchema = z.enum([
  "PRICE_LEVEL_UNSPECIFIED",
  "PRICE_LEVEL_FREE",
  "PRICE_LEVEL_INEXPENSIVE",
  "PRICE_LEVEL_MODERATE",
  "PRICE_LEVEL_EXPENSIVE",
  "PRICE_LEVEL_VERY_EXPENSIVE",
]);

const LocalizedTextSchema = z.object({
  text: z.string().nullish(),
  languageCode: z.string().nullish(),
});

const AuthorAttributionSchema = z.object({
  displayName: z.string().nullish(),
  uri: z.string().nullish(),
  photoUri: z.string().nullish(),
});

const ReviewSchema = z.object({
  name: z.string().nullish(),
  relativePublishTimeDescription: z.string().nullish(),
  rating: z.number().min(1).max(5).nullish(),
  text: LocalizedTextSchema.nullish(),
  originalText: LocalizedTextSchema.nullish(),
  authorAttribution: AuthorAttributionSchema.nullish(),
  publishTime: z.string().nullish(),
});

const OpeningHoursPointSchema = z.object({
  day: z.number().min(0).max(6).nullish(),
  hour: z.number().min(0).max(23).nullish(),
  minute: z.number().min(0).max(59).nullish(),
});

const OpeningHoursPeriodSchema = z.object({
  open: OpeningHoursPointSchema.nullish(),
  close: OpeningHoursPointSchema.nullish(),
});

const OpeningHoursSchema = z.object({
  periods: z.array(OpeningHoursPeriodSchema).nullish(),
  weekdayDescriptions: z.array(z.string()).nullish(),
  openNow: z.boolean().nullish(),
});

const PhotoSchema = z.object({
  name: z.string().nullish(),
  widthPx: z.number().nullish(),
  heightPx: z.number().nullish(),
  authorAttributions: z.array(AuthorAttributionSchema).nullish(),
});

export const PlaceSchema = z.object({
  displayName: LocalizedTextSchema.nullish(),
  rating: z.number().min(1).max(5).nullish(),
  userRatingCount: z.number().nullish(),
  reviews: z.array(ReviewSchema).nullish(),
  reviewSummary: LocalizedTextSchema.nullish(),
  editorialSummary: LocalizedTextSchema.nullish(),
  regularOpeningHours: OpeningHoursSchema.nullish(),
  priceLevel: PriceLevelSchema.nullish(),
  photos: z.array(PhotoSchema).nullish(),
  primaryTypeDisplayName: LocalizedTextSchema.nullish(),
  websiteUri: z.string().nullish(),
  googleMapsUri: z.string().nullish(),
  formattedAddress: z.string().nullish(),
});

export type Place = z.infer<typeof PlaceSchema>;

const googleMapsPlacesClient = new GoogleMapsPlacesClient({
  apiKey: env.googleMaps.apiKey,
});

export const searchGoogleMapsTool = tool({
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "the kind of establishment you are looking for i.e. cafe, pizza joint, upscale italian diner",
      ),
    location: z.object({
      area: z
        .string()
        .describe(
          `the area within the city/state. could be "midtown" for a city of manhattan`,
        ),
      city: z.string(),
      state: z.string().length(2).describe("two digit state code"),
    }),
  }),
  inputExamples: [
    {
      input: {
        query: "NY style pizza which offers slices",
        location: {
          area: "midtown",
          city: "New York",
          state: "NY",
        },
      },
    },
    {
      input: {
        query: "Classy japanese restaurant for a date",
        location: {
          area: "Long Island City, Queens",
          city: "New York",
          state: "NY",
        },
      },
    },
  ],
  description: "Search for places based on a query and location",
  outputSchema: z.array(PlaceSchema),
  execute: async ({ query, location }): Promise<Place[]> => {
    const textQuery =
      query +
      " in " +
      location.area +
      " - " +
      location.city +
      ", " +
      location.state;

    const res = await googleMapsPlacesClient.searchText(
      {
        textQuery,
        minRating: 4,
        priceLevels: [
          protos.google.maps.places.v1.PriceLevel.PRICE_LEVEL_UNSPECIFIED,
          protos.google.maps.places.v1.PriceLevel.PRICE_LEVEL_INEXPENSIVE,
          protos.google.maps.places.v1.PriceLevel.PRICE_LEVEL_MODERATE,
        ],
      },
      {
        otherArgs: {
          headers: {
            "X-Goog-FieldMask": [
              "places.displayName",
              "places.rating",
              "places.userRatingCount",
              // "places.reviews",
              "places.reviewSummary",
              "places.editorialSummary",
              "places.regularOpeningHours",
              "places.priceLevel",
              // "places.photos",
              "places.primaryTypeDisplayName",
              "places.websiteUri",
              "places.googleMapsUri",
              "places.formattedAddress",
            ].join(","),
          },
        },
      },
    );

    const places = res[0].places;
    if (!places) {
      throw new Error(`places were not returned\n` + JSON.stringify(res));
    }

    return places.map(
      (place): Place => ({
        displayName: place.displayName,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        reviews: place.reviews?.map((review) => ({
          name: review.name,
          relativePublishTimeDescription: review.relativePublishTimeDescription,
          rating: review.rating,
          text: review.text,
          originalText: review.originalText,
          authorAttribution: review.authorAttribution,
          publishTime: review.publishTime
            ? new Date(Number(review.publishTime.seconds) * 1000).toISOString()
            : null,
        })),
        reviewSummary: place.reviewSummary?.text,
        editorialSummary: place.editorialSummary,
        regularOpeningHours: place.regularOpeningHours,
        priceLevel: place.priceLevel as Place["priceLevel"],
        photos: place.photos,
        primaryTypeDisplayName: place.primaryTypeDisplayName,
        websiteUri: place.websiteUri,
        googleMapsUri: place.googleMapsUri,
        formattedAddress: place.formattedAddress,
      }),
    );
  },
});

// googleMapsPlacesClient
//   .searchText(
//     {
//       textQuery: "best pizza in midtown, manhattan",
//       minRating: 4,
//       priceLevels: [
//         protos.google.maps.places.v1.PriceLevel.PRICE_LEVEL_UNSPECIFIED,
//         protos.google.maps.places.v1.PriceLevel.PRICE_LEVEL_INEXPENSIVE,
//         protos.google.maps.places.v1.PriceLevel.PRICE_LEVEL_MODERATE,
//       ],
//     },
//     {
//       otherArgs: {
//         headers: {
//           "X-Goog-FieldMask": [
//             "places.displayName",
//             "places.rating",
//             "places.userRatingCount",
//             "places.reviews",
//             "places.reviewSummary",
//             "places.editorialSummary",
//             "places.regularOpeningHours",
//             "places.priceLevel",
//             "places.photos",
//             "places.primaryTypeDisplayName",
//             "places.websiteUri",
//             "places.googleMapsUri",
//             "places.formattedAddress",
//           ].join(","),
//         },
//       },
//     },
//   )
//   .then((res) => {
//     console.log(res[0].places);
//   });
