module.exports = {
  /*
        Ordena os "documentos"(json's) alfabeticamente, com base em
        um campo específico(field)
      */
  sortDocsInArray(array, field, option) {
    return array.sort((x, y) => {
      let a = x;
      let b = y;
      if (a[field].toLowerCase() !== b[field].toLowerCase()) {
        a = a[field].toLowerCase();
        b = b[field].toLowerCase();
      }
      if (option === -1) {
        if (a < b) {
          return 1;
        } else if (a > b) {
          return -1;
        }
        return 0;
      }
      if (a > b) {
        return 1;
      } else if (a < b) {
        return -1;
      }
      return 0;
    });
  },
  mergeCheckboxData({ options, values }, dataSource = {}) {
    /* This will take the list of checkbox names as "options",
     * the list of checked checkboxes as "values" and it will
     * group together this values into "dataSource".
     *
     * For example:
     *
     * options = { teaching_levels: ["name1", "name2"], ... };
     * values = { teaching_levels: ["value1, "value2"], ... };
     * data = {
     *   teaching_levels: {
     *     options: ["name1", "name2"],
     *     values: ["value1", "value2"],
     *   },
     *   ...
     *   something_else: "this was already here",
     * };
     */

    // You can give an existing object.
    const data = dataSource;

    [
      'teaching_levels',
      'axes',
      'accessibility_resources',
      'contents',
      'resources',
    ].forEach((prop) => {
      data[prop] = {
        options: options[prop],
        values: values[prop],
      };
    });

    return data;
  },
};

