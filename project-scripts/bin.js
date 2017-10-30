module.exports = {
  DebugMode: false,
  entry: (entry) => {
    //console.log(entry);
  },
  output: (output) => {
    output.filename       = '[name].js';
    output.libraryTarget  = 'umd';
    output.umdNamedDefine = true;
  },
  plugins: (plugins) => {
    // remove html-webpack-plugin
    plugins.splice(1, 1);
    // remove manifest-plugin
    plugins.splice(4, 1);
    // remove sw-precache-webpack-plugin
    plugins.splice(4, 1);
  }
}