import { graphqlRequest } from './graphql';

// GraphQL Queries and Mutations for Categories
const GET_ALL_CATEGORIES = `
  query GetAllCategories($query: String, $first: Int!, $after: String, $isArchived: Boolean) {
    allCategories(query: $query, first: $first, after: $after, isArchived: $isArchived) {
      categories {
        id
        name
        description
        image
        isActive
        isArchived
        parent {
          id
          name
          image
        }
      }
      nextCursor
      hasMore
      totalCategories
      activeCategories
      inactiveCategories
      archivedCategories
    }
  }
`;

const CREATE_CATEGORY = `
  mutation CreateCategory($name: String!, $description: String, $image: String, $isActive: Boolean, $parentId: Int) {
    createCategory(
      name: $name
      description: $description
      image: $image
      isActive: $isActive
      parentId: $parentId
    ) {
      category {
        id
        name
        parent {
          id
          name
        }
      }
    }
  }
`;

const UPDATE_CATEGORY = `
  mutation UpdateCategory($id: Int!, $name: String, $description: String, $image: String, $isActive: Boolean, $parentId: Int) {
    updateCategory(
      id: $id
      name: $name
      description: $description
      image: $image
      isActive: $isActive
      parentId: $parentId
    ) {
      category {
        id
        name
        parent {
          id
          name
        }
      }
    }
  }
`;

const DELETE_CATEGORY = `
  mutation DeleteCategory($id: Int!) {
    deleteCategory(id: $id) {
      success
    }
  }
`;



export const getAllCategories = async ({
  query = null,
  first = 10,
  after = null,
  isArchived = false,
}) => {
  try {
    const response = await graphqlRequest(
      GET_ALL_CATEGORIES,
      {
        query,
        first,
        after,
        isArchived,
      }
    );

    return {
      success: true,
      categories: response.allCategories.categories,
      nextCursor: response.allCategories.nextCursor,
      hasMore: response.allCategories.hasMore,
      totalCategories: response.allCategories.totalCategories,
      activeCategories: response.allCategories.activeCategories,
      inactiveCategories: response.allCategories.inactiveCategories,
      archivedCategories: response.allCategories.archivedCategories,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


export const createCategory = async (categoryData) => {
  try {
    const variables = {
      name: categoryData.name,
      description: categoryData.description || "",
      image: categoryData.image || "",
      isActive: categoryData.isActive ?? true,
      parentId: categoryData.parentId || null
    };

    const data = await graphqlRequest(CREATE_CATEGORY, variables);

    return {
      success: true,
      category: data.createCategory.category
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};


export const updateCategory = async (id, categoryData) => {
  try {
    const variables = {
      id: Number(id),   // ✅ VERY IMPORTANT
      name: categoryData.name,
      description: categoryData.description,
      image: categoryData.image,
      isActive: categoryData.isActive,
      parentId: categoryData.parentId ? Number(categoryData.parentId) : null
    };

    const data = await graphqlRequest(UPDATE_CATEGORY, variables);

    return {
      success: true,
      category: data.updateCategory.category
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};



export const deleteCategory = async (id) => {
  try {
    const data = await graphqlRequest(DELETE_CATEGORY, {
      id: Number(id) // ✅ important
    });

    return {
      success: true
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};
