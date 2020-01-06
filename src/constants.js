/**
 * @module constants
 */

const BREADTH_FIRST = "BREADTH_FIRST";
const DEPTH_FIRST_PRE_ORDER = "PRE_ORDER";
const DEPTH_FIRST_POST_ORDER = "POST_ORDER";

module.exports = {
  /** @type {Object<string,searchType>} */
  SEARCH_TYPES: {
    /** @type {breadthfirst} */
    BREADTH_FIRST,
    /** @type {depthfirstpre} */
    DEPTH_FIRST_PRE_ORDER,
    /** @type {depthfirstpost} */
    DEPTH_FIRST_POST_ORDER
  }
};

/**
 * @typedef {breadthfirst|depthfirstpre|depthfirstpost} searchType
 */

/**
 * @typedef {string} breadthfirst
 */

/**
 * @typedef {string} depthfirstpre
 */

/**
 * @typedef {string} depthfirstpost
 */
