const elasticClient = require("../config/elasticsearchConfig");

const createMapping = async () => {
  try {
    const exists = await elasticClient.indices.exists({ index: "discussions" });
    if (!exists) {
      await elasticClient.indices.create({
        index: "discussions",
        body: {
          mappings: {
            properties: {
              text: { type: "text" },
              hashtags: { type: "keyword" },
              userId: { type: "text" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
            },
          },
        },
      });
      console.log("Index and mapping created");
    } else {
      console.log("Index already exists");
    }
  } catch (error) {
    console.error("Error creating mapping:", error);
  }
};

createMapping();
