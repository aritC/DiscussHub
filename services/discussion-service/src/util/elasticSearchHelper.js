const esclient = require("../config/elasticsearchConfig");

const addDiscussion = async (document) => {
  try {
    const { _id, ...documentBody } = { document };

    const res = await esclient.index({
      index: "discussions",
      body: documentBody,
      id: _id,
    });

    return res;
  } catch (error) {
    console.error("Error inserting document:", error);
    throw error;
  }
};

const searchDiscussionByTags = async (tags) => {
  const tagsString = tags.reduce((str, tag) => str + " " + tag, "");
  console.log(tagsString);

  try {
    const res = await esclient.search({
      index: "discussions",
      q: tagsString,
    });
    return res.hits.hits;
  } catch (error) {
    console.error("Error searching documents by tag:", error);
    throw error;
  }
};

const searchDiscussionsByText = async (text) => {
  try {
    const res = await esclient.search({
      index: "discussions",
      q: text,
    });
    return res.hits.hits;
  } catch (error) {
    console.error("Error searching documents by text:", error);
    throw error;
  }
};

module.exports = {
  addDiscussion,
  searchDiscussionByTags,
  searchDiscussionsByText,
};
