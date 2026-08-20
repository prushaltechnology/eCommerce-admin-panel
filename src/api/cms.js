import { graphqlRequest } from './graphql';


// ───────────────── HERO ─────────────────

export const getHeroSections = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        heroSection {
          id
          badgeText
          titleLine1
          highlightText
          description
          buttonText
          buttonLink
          heroImage
        }
      }
    `);

    return {
      success: true,
      heroes: data?.heroSection || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateHero = async (values) => {
  try {
    const data = await graphqlRequest(
      `
      mutation UpdateHero(
        $badgeText: String
        $titleLine1: String!
        $highlightText: String!
        $description: String!
        $buttonText: String!
        $buttonLink: String!
        $heroImage: Upload
      ) {
        updateHero(
          badgeText: $badgeText
          titleLine1: $titleLine1
          highlightText: $highlightText
          description: $description
          buttonText: $buttonText
          buttonLink: $buttonLink
          heroImage: $heroImage
        ) {
          hero {
            id
            badgeText
            titleLine1
            highlightText
            description
            buttonText
            buttonLink
            heroImage
          }
        }
      }
    `,
      values
    );

    return {
      success: true,
      hero: data?.updateHero?.hero,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


// ───────────────── WHY CHOOSE US ─────────────────

export const getWhyChooseUs = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        whyChooseUsSection {
          id
          badgeText
          title
          description
        }
      }
    `);

    return {
      success: true,
      sections: data?.whyChooseUsSection || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateWhyChooseUs = async (values) => {
  try {
    const data = await graphqlRequest(
      `
      mutation UpdateWhyChooseUs(
        $badgeText: String!
        $title: String!
        $description: String!
      ) {
        updateWhyChooseUs(
          badgeText: $badgeText
          title: $title
          description: $description
        ) {
          section {
            id
            badgeText
            title
            description
          }
        }
      }
    `,
      values
    );

    return {
      success: true,
      section: data?.updateWhyChooseUs?.section,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


// ───────────────── CONTACT INFO ─────────────────

export const getContactInfo = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        contactInfoSection {
          id
          title
          email
          phone
          address
          googleMapEmbedUrl
          googleMapLink
          latitude
          longitude
        }
      }
    `);

    return {
      success: true,
      contacts: data?.contactInfoSection || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateContactInfo = async (values) => {
  try {
    const data = await graphqlRequest(
      `
      mutation UpdateContactInfo(
        $title: String!
        $email: String!
        $phone: String!
        $address: String!
        $googleMapLink: String!
        $googleMapEmbedUrl: String!
        $latitude: Float!
        $longitude: Float!
      ) {
        updateContactInfo(
          title: $title
          email: $email
          phone: $phone
          address: $address
          googleMapLink: $googleMapLink
          googleMapEmbedUrl: $googleMapEmbedUrl
          latitude: $latitude
          longitude: $longitude
        ) {
          infoObj {
            id
            title
            email
            phone
            address
            googleMapEmbedUrl
            googleMapLink
            latitude
            longitude
          }
        }
      }
    `,
      values
    );

    return {
      success: true,
      contact: data?.updateContactInfo?.infoObj,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


// ───────────────── ABOUT SECTION ─────────────────

export const getAboutSections = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        aboutSection {
          id
          badgeText
          title
          description
        }
      }
    `);

    return {
      success: true,
      abouts: data?.aboutSection || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateAboutSection = async (values) => {
  try {
    const data = await graphqlRequest(
      `
      mutation UpdateAboutSection(
        $badgeText: String
        $title: String!
        $description: String!
      ) {
        updateAboutSection(
          badgeText: $badgeText
          title: $title
          description: $description
        ) {
          about {
            id
            badgeText
            title
            description
          }
        }
      }
    `,
      values
    );

    return {
      success: true,
      about: data?.updateAboutSection?.about,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


// ───────────────── ABOUT STORY ─────────────────

export const getAboutStorySections = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        aboutStorySection {
          id
          sectionTag
          title
          description1
          description2
          image
          imageAlt
        }
      }
    `);

    return {
      success: true,
      stories: data?.aboutStorySection || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


export const updateAboutStorySection = async (values) => {
  try {

    const data = await graphqlRequest(
      `
      mutation UpdateAboutStorySection(
        $sectionTag: String
        $title: String!
        $description1: String
        $description2: String
        $image: Upload
        $imageAlt: String
      ) {
        updateAboutStorySection(
          sectionTag: $sectionTag
          title: $title
          description1: $description1
          description2: $description2
          image: $image
          imageAlt: $imageAlt
        ) {
          aboutStory {
            id
            sectionTag
            title
            description1
            description2
            image
            imageAlt
          }
        }
      }
    `,
      values
    );

    return {
      success: true,
      story: data?.updateAboutStorySection?.aboutStory,
    };

  } catch (error) {

    return {
      success: false,
      message: error.message,
    };
  }
};


// ───────────────── SEO ─────────────────

export const getSeoSections = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        seoSection {
          id
          title
          description
        }
      }
    `);

    return {
      success: true,
      seos: data?.seoSection || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateSeoSection = async (values) => {
  try {
    const data = await graphqlRequest(
      `
      mutation UpdateSeoSection(
        $title: String!
        $description: String!
      ) {
        updateSeoContentSection(
          title: $title
          description: $description
        ) {
          seo {
            id
            title
            description
          }
        }
      }
    `,
      values
    );

    return {
      success: true,
      seo: data?.updateSeoContentSection?.seo,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


// ───────────────── FEATURES ─────────────────

export const getFeatures = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        allFeatures {
          id
          title
          description
          icon
          iconType
        }
      }
    `);

    return {
      success: true,
      features: data?.allFeatures || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateFeature = async (id, values) => {
  try {
    const data = await graphqlRequest(
      `
      mutation UpdateFeature(
        $id: ID!
        $title: String!
        $description: String!
        $icon: String!
        $iconType: String!
      ) {
        updateFeature(
          id: $id
          title: $title
          description: $description
          icon: $icon
          iconType: $iconType
        ) {
          feature {
            id
            title
            description
            icon
            iconType
          }
        }
      }
    `,
      { id, ...values }
    );

    return {
      success: true,
      feature: data?.updateFeature?.feature,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};
//------FAQ-----

export const getFaqs = async () => {
  try {
    const data = await graphqlRequest(`
      query GetFAQs {
        faqs {
          id
          question
          answer
          displayOrder
          isActive
          createdAt
          updatedAt
        }
      }
    `);
    return { success: true, faqs: data.faqs || [] };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createFaq = async (payload) => {
  try {
    const { question, answer, displayOrder, isActive } = payload;
    const data = await graphqlRequest(`
      mutation CreateFAQ(
        $question: String!,
        $answer: String!,
        $displayOrder: Int,
        $isActive: Boolean
      ) {
        createFaq(
          question: $question,
          answer: $answer,
          displayOrder: $displayOrder,
          isActive: $isActive
        ) {
          success
          message
          faq { id question answer displayOrder isActive }
        }
      }
    `, { question, answer, displayOrder, isActive });

    const result = data.createFaq;
    return result.success
      ? { success: true, faq: result.faq }
      : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteFaq = async (id) => {
  try {
    const data = await graphqlRequest(`
      mutation DeleteFaq($id: Int!) {
        deleteFaq(id: $id) {
          success
          message
        }
      }
    `, { id: Number(id) });

    const result = data.deleteFaq;
    return result.success
      ? { success: true }
      : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateFaq = async (id, payload) => {
  try {
    const { question, answer, displayOrder, isActive } = payload;
    const data = await graphqlRequest(`
      mutation UpdateFaq(
        $id: Int!,
        $question: String,
        $answer: String,
        $displayOrder: Int,
        $isActive: Boolean
      ) {
        updateFaq(
          id: $id,
          question: $question,
          answer: $answer,
          displayOrder: $displayOrder,
          isActive: $isActive
        ) {
          success
          message
          faq { id displayOrder }
        }
      }
    `, { id: Number(id), question, answer, displayOrder, isActive });

    const result = data.updateFaq;
    return result.success
      ? { success: true }
      : { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};


export const getAllContactForms = async ({ search = '', first = 10, after = null } = {}) => {
  try {
    const data = await graphqlRequest(`
      query GetContactForms($first: Int!, $after: String, $search: String) {
        allContactUs(first: $first, after: $after, search: $search) {
          nextCursor
          hasMore
          contacts {
            id
            name
            email
            phone
            message
            createdAt
          }
        }
      }
    `, { first, after, search });
    const result = data?.allContactUs;
    return {
      success: true,
      contacts: result?.contacts || [],
      nextCursor: result?.nextCursor || null,
      hasMore: result?.hasMore || false,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAllNewsletterSubscribers = async ({ first = 15, after = null } = {}) => {
  try {
    const data = await graphqlRequest(`
      query GetNewsletterSubscribers($first: Int!, $after: String) {
        allNewsletterSubscribers(first: $first, after: $after) {
          nextCursor
          hasMore
          subscribers {
            id
            email
            subscribedAt
          }
        }
      }
    `, { first, after });
    const result = data?.allNewsletterSubscribers;
    return {
      success: true,
      subscribers: result?.subscribers || [],
      nextCursor: result?.nextCursor || null,
      hasMore: result?.hasMore || false,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ───────────────── STORE SETTINGS ─────────────────

export const getStoreSettings = async () => {
  try {
    const data = await graphqlRequest(`
      query {
        storeSettings {
          storeName
          storeLogo
          storeAddress
          contactNo
          storefrontTheme
          advanceBookingStartTime
          advanceBookingEndTime
        }
      }
    `);

    return {
      success: true,
      settings: data?.storeSettings || null,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateStoreSettings = async (values) => {
  try {
    const data = await graphqlRequest(
      `
      mutation UpdateStoreSettings(
        $storeName: String
        $storeLogo: Upload
        $storeAddress: String
        $contactNo: String
        $storefrontTheme: GenericScalar
        $advanceBookingStartTime: Time
        $advanceBookingEndTime: Time
      ) {
        updateStoreSettings(
          storeName: $storeName
          storeLogo: $storeLogo
          storeAddress: $storeAddress
          contactNo: $contactNo
          storefrontTheme: $storefrontTheme
          advanceBookingStartTime: $advanceBookingStartTime
          advanceBookingEndTime: $advanceBookingEndTime
        ) {
          storeSettings {
            storeName
            storeLogo
            storeAddress
            contactNo
            storefrontTheme
            advanceBookingStartTime
            advanceBookingEndTime
          }
        }
      }
    `,
      values
    );

    return {
      success: true,
      settings: data?.updateStoreSettings?.storeSettings,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};