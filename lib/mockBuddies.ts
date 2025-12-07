// lib/mockBuddies.ts
export interface FishingBuddy {
  id: string;
  display_name: string;
  age: number;
  location: string;
  distance: number; // Distance in miles
  tackle_categories: string[];
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  bio: string;
  profile_photo_url?: string;
  last_active: string;
  has_boat: boolean;
  boat_type?: string;
  boat_name?: string;
  boat_length?: string;
  favorite_species: string[];
  home_port: string;
  fishing_type: 'freshwater' | 'saltwater';
  instagram?: string;
  preferred_times?: string[];
}

// Mock profile photos (using placeholder URLs)
const mockPhotos = {
  saltwater: [
    'https://images.unsplash.com/photo-1529230117010-b6c436154f25?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1516690553959-71a414d6b9b6?w=400&h=500&fit=crop',
  ],
  freshwater: [
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1504309250229-4f08315f7b5e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1528837516156-0a7225a43641?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1500463959177-e0869687df26?w=400&h=500&fit=crop',
  ]
};

export const mockSaltwaterBuddies: FishingBuddy[] = [
  {
    id: 'sw1',
    display_name: 'Captain Mike',
    age: 42,
    location: 'Point Judith, RI',
    distance: 8,
    tackle_categories: ['Heavy Spinning', 'Jigging', 'Trolling'],
    experience_level: 'Advanced',
    bio: "30+ years fishing the Northeast waters. I run charters out of Point Judith targeting stripers, blues, and tuna. Always looking for serious anglers to share fuel costs on off days.",
    profile_photo_url: mockPhotos.saltwater[0],
    last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    has_boat: true,
    boat_type: 'Center Console',
    boat_name: 'Reel Deal',
    boat_length: '31-35ft',
    favorite_species: ['Striped Bass', 'Tuna', 'Bluefish'],
    home_port: 'Point Judith Marina',
    fishing_type: 'saltwater',
    instagram: '@captmike_ri',
    preferred_times: ['Dawn', 'Dusk']
  },
  {
    id: 'sw2',
    display_name: 'Sarah T',
    age: 28,
    location: 'Newport, RI',
    distance: 12,
    tackle_categories: ['Light Spinning', 'Surf Casting'],
    experience_level: 'Intermediate',
    bio: "Marine biologist turned fishing enthusiast. Love early morning surf casting for stripers and sharing knowledge about sustainable fishing practices. Let's protect what we love!",
    profile_photo_url: mockPhotos.saltwater[1],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    has_boat: false,
    favorite_species: ['Striped Bass', 'Fluke', 'Sea Bass'],
    home_port: 'Castle Hill',
    fishing_type: 'saltwater',
    instagram: '@oceanbiosarah',
    preferred_times: ['Early Morning', 'Morning']
  },
  {
    id: 'sw3',
    display_name: 'Tony "Tuna"',
    age: 55,
    location: 'Galilee, RI',
    distance: 10,
    tackle_categories: ['Heavy Spinning', 'Trolling', 'Jigging'],
    experience_level: 'Advanced',
    bio: "Tournament angler, 3x Block Island tuna champion. Have a 35' Contender always rigged and ready. Split costs, catch giants, tell stories. Simple as that.",
    profile_photo_url: mockPhotos.saltwater[2],
    last_active: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    has_boat: true,
    boat_type: 'Sportfisher',
    boat_name: 'Tuna Terror',
    boat_length: '36-40ft',
    favorite_species: ['Tuna', 'Mahi', 'Striped Bass'],
    home_port: 'Port of Galilee',
    fishing_type: 'saltwater',
    preferred_times: ['Dawn', 'Morning', 'Afternoon']
  },
  {
    id: 'sw4',
    display_name: 'Jake Sullivan',
    age: 34,
    location: 'Wickford, RI',
    distance: 18,
    tackle_categories: ['Light Spinning', 'Jigging'],
    experience_level: 'Beginner',
    bio: "New to saltwater fishing but eager to learn! Just moved to RI from Colorado. Have all the gear, need the knowledge. Happy to help with boat costs or shore fishing.",
    profile_photo_url: mockPhotos.saltwater[3],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    has_boat: false,
    favorite_species: ['Striped Bass', 'Fluke'],
    home_port: 'Wickford Harbor',
    fishing_type: 'saltwater',
    preferred_times: ['Weekends Only']
  },
  {
    id: 'sw5',
    display_name: 'Captain Amanda',
    age: 38,
    location: 'Narragansett, RI',
    distance: 5,
    tackle_categories: ['Light Spinning', 'Heavy Spinning', 'Surf Casting'],
    experience_level: 'Advanced',
    bio: "USCG licensed captain. Specialize in light tackle and fly fishing for albies and bonito. My 24' bay boat is perfect for skinny water. Dawn patrol is my favorite!",
    profile_photo_url: mockPhotos.saltwater[4],
    last_active: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    has_boat: true,
    boat_type: 'Bay Boat',
    boat_name: 'Salty Sisters',
    boat_length: '20-25ft',
    favorite_species: ['False Albacore', 'Bonito', 'Striped Bass'],
    home_port: 'Ram Point Marina',
    fishing_type: 'saltwater',
    instagram: '@saltysistercharters',
    preferred_times: ['Dawn', 'Early Morning']
  },
  {
    id: 'sw6',
    display_name: 'Dave "Fluke" Finder',
    age: 48,
    location: 'Watch Hill, RI',
    distance: 25,
    tackle_categories: ['Light Spinning', 'Jigging'],
    experience_level: 'Intermediate',
    bio: "Fluke fanatic! Know all the best drifts from Watch Hill to Block Island. Looking for buddies who appreciate the art of bucktailing. 22' Parker always ready to go.",
    profile_photo_url: mockPhotos.saltwater[0],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    has_boat: true,
    boat_type: 'Center Console',
    boat_name: 'Fluke Finder',
    boat_length: '20-25ft',
    favorite_species: ['Fluke', 'Sea Bass', 'Tautog'],
    home_port: 'Watch Hill Marina',
    fishing_type: 'saltwater',
    preferred_times: ['Morning', 'Afternoon']
  }
];

export const mockFreshwaterBuddies: FishingBuddy[] = [
  {
    id: 'fw1',
    display_name: 'Big Bass Bill',
    age: 45,
    location: 'Lake Winnipesaukee, NH',
    distance: 75,
    tackle_categories: ['Baitcasting', 'Medium Spinning'],
    experience_level: 'Advanced',
    bio: "Tournament bass angler with 20+ years experience. Know every honey hole on Winnipesaukee. Running a Ranger 520 with all the electronics. Let's chase some hawgs!",
    profile_photo_url: mockPhotos.freshwater[0],
    last_active: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    has_boat: true,
    boat_type: 'Bass Boat',
    boat_name: 'Bass Master',
    boat_length: '20-25ft',
    favorite_species: ['Bass', 'Pike', 'Perch'],
    home_port: 'Alton Bay',
    fishing_type: 'freshwater',
    instagram: '@bigbassbill_nh',
    preferred_times: ['Dawn', 'Dusk']
  },
  {
    id: 'fw2',
    display_name: 'Emma Fisher',
    age: 26,
    location: 'Lake George, NY',
    distance: 120,
    tackle_categories: ['Fly', 'Light Spinning'],
    experience_level: 'Intermediate',
    bio: "Fly fishing enthusiast and outdoor photographer. Love catching native brook trout in the Adirondacks. Always looking for scenic spots and fishing buddies who respect nature.",
    profile_photo_url: mockPhotos.freshwater[1],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    has_boat: false,
    favorite_species: ['Trout', 'Bass', 'Pike'],
    home_port: 'Lake George Village',
    fishing_type: 'freshwater',
    instagram: '@flyfishemma',
    preferred_times: ['Early Morning', 'Morning']
  },
  {
    id: 'fw3',
    display_name: 'Old Timer Tom',
    age: 67,
    location: 'Lake Champlain, VT',
    distance: 150,
    tackle_categories: ['Ice Fishing', 'Light Spinning', 'Medium Spinning'],
    experience_level: 'Advanced',
    bio: "Retired and fishing every day. Know Champlain like the back of my hand. Got a reliable Lund with a 4-stroke. Coffee's always hot, stories are free, let's catch some walleye!",
    profile_photo_url: mockPhotos.freshwater[2],
    last_active: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    has_boat: true,
    boat_type: 'Jon Boat',
    boat_name: 'Time Killer',
    boat_length: 'Under 20ft',
    favorite_species: ['Walleye', 'Pike', 'Perch', 'Bass'],
    home_port: 'Burlington Harbor',
    fishing_type: 'freshwater',
    preferred_times: ['Early Morning', 'Morning', 'Afternoon']
  },
  {
    id: 'fw4',
    display_name: 'College Chris',
    age: 22,
    location: 'Quabbin Reservoir, MA',
    distance: 45,
    tackle_categories: ['Light Spinning', 'Fly'],
    experience_level: 'Beginner',
    bio: "URI student, fishing team member. Learning to fish New England waters. Have a kayak and basic gear. Down for early morning sessions before class!",
    profile_photo_url: mockPhotos.freshwater[3],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    has_boat: false,
    favorite_species: ['Bass', 'Trout'],
    home_port: 'Gate 8 Launch',
    fishing_type: 'freshwater',
    instagram: '@chrisfishesuri',
    preferred_times: ['Early Morning', 'Weekends Only']
  },
  {
    id: 'fw5',
    display_name: 'Pike Mike',
    age: 39,
    location: 'Connecticut River, CT',
    distance: 65,
    tackle_categories: ['Medium Spinning', 'Heavy Spinning', 'Baitcasting'],
    experience_level: 'Intermediate',
    bio: "Northern pike specialist. If it has teeth, I'm hunting it. Got a 20' aluminum perfect for river fishing. Always catch and release for the big ones. Tight lines!",
    profile_photo_url: mockPhotos.freshwater[4],
    last_active: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    has_boat: true,
    boat_type: 'Jon Boat',
    boat_name: 'Pike Finder',
    boat_length: 'Under 20ft',
    favorite_species: ['Pike', 'Bass', 'Catfish'],
    home_port: 'Haddam Meadows',
    fishing_type: 'freshwater',
    preferred_times: ['Dawn', 'Dusk', 'Night']
  }
];

// Combine all mock buddies
export const allMockBuddies = [...mockSaltwaterBuddies, ...mockFreshwaterBuddies];

// Function to get buddies from Supabase (for future implementation)
export async function getBuddiesFromSupabase(filters?: any): Promise<FishingBuddy[]> {
  // TODO: Implement Supabase query
  // For now, return mock data
  return allMockBuddies;
}