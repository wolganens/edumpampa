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
};
