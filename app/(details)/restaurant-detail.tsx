import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";

type RestaurantDetails = {
  name: string;
  rating: number;
  formatted_address: string;
  formatted_phone_number: string;
  opening_hours?: {
    weekday_text: string[];
  };
  photos: Array<{
    photo_reference: string;
  }>;
  types: string[];
  price_level?: number;
  website?: string;
};

export default function RestaurantDetailScreen() {
  const { place_id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRestaurantDetails();
  }, []);

  const fetchRestaurantDetails = async () => {
    try {
      // Replace 'YOUR_API_KEY' with your actual Google Places API key
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,rating,formatted_phone_number,formatted_address,opening_hours,photos,types,price_level,website&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        setRestaurant(data.result);
      } else {
        console.error("Failed to fetch restaurant details:", data.status);
      }
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
    } finally {
      setLoading(false);
    }
  };

  const openMaps = () => {
    if (!restaurant) return;

    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const label = encodeURIComponent(restaurant.name);
    const address = encodeURIComponent(restaurant.formatted_address);
    const url = Platform.select({
      ios: `${scheme}${label}@${address}`,
      android: `${scheme}${address}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const callRestaurant = () => {
    if (restaurant?.formatted_phone_number) {
      Linking.openURL(`tel:${restaurant.formatted_phone_number}`);
    }
  };

  const openWebsite = () => {
    if (restaurant?.website) {
      Linking.openURL(restaurant.website);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "",
            headerStyle: {
              backgroundColor: "white",
            },
            headerShadowVisible: false,
            headerLeft:
              Platform.OS === "ios"
                ? () => (
                    <TouchableOpacity
                      style={{ marginLeft: 8 }}
                      onPress={() => router.back()}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={24}
                        color={Colors.light.primary}
                      />
                    </TouchableOpacity>
                  )
                : undefined,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading restaurant details...</Text>
        </View>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "",
            headerStyle: {
              backgroundColor: "white",
            },
            headerShadowVisible: false,
            headerLeft:
              Platform.OS === "ios"
                ? () => (
                    <TouchableOpacity
                      style={{ marginLeft: 8 }}
                      onPress={() => router.back()}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={24}
                        color={Colors.light.primary}
                      />
                    </TouchableOpacity>
                  )
                : undefined,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.light.error}
          />
          <Text style={styles.errorText}>
            Failed to load restaurant details
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchRestaurantDetails()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: {
            backgroundColor: "white",
          },
          headerShadowVisible: false,
          headerLeft:
            Platform.OS === "ios"
              ? () => (
                  <TouchableOpacity
                    style={{ marginLeft: 8 }}
                    onPress={() => router.back()}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={Colors.light.primary}
                    />
                  </TouchableOpacity>
                )
              : undefined,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          {restaurant.photos && restaurant.photos.length > 0 ? (
            <Image
              source={{
                uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${restaurant.photos[0].photo_reference}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`,
              }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="restaurant"
                size={48}
                color={Colors.light.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.details}>
            {restaurant.types[0].replace("_", " ")} • {restaurant.rating}★
            {restaurant.price_level &&
              ` • ${Array(restaurant.price_level).fill("$").join("")}`}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Contact</Text>
            <TouchableOpacity style={styles.infoRow} onPress={openMaps}>
              <Ionicons
                name="location"
                size={24}
                color={Colors.light.primary}
              />
              <Text style={styles.infoText}>
                {restaurant.formatted_address}
              </Text>
            </TouchableOpacity>
            {restaurant.formatted_phone_number && (
              <TouchableOpacity style={styles.infoRow} onPress={callRestaurant}>
                <Ionicons name="call" size={24} color={Colors.light.primary} />
                <Text style={styles.infoText}>
                  {restaurant.formatted_phone_number}
                </Text>
              </TouchableOpacity>
            )}
            {restaurant.website && (
              <TouchableOpacity style={styles.infoRow} onPress={openWebsite}>
                <Ionicons name="globe" size={24} color={Colors.light.primary} />
                <Text style={styles.infoText}>Visit Website</Text>
              </TouchableOpacity>
            )}
          </View>

          {restaurant.opening_hours && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opening Hours</Text>
              {restaurant.opening_hours.weekday_text.map((hours, index) => (
                <Text key={index} style={styles.hoursText}>
                  {hours}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.tagsContainer}>
              {restaurant.types.map((type, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{type.replace("_", " ")}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  imageContainer: {
    height: 200,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  details: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  hoursText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.background,
  },
});
