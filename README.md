# EmPrevious2
Emscripted Previous (take 2)

---

## Building with Emscripten

[Emscripten](https://emscripten.org/) is an LLVM-to-Web compiler that allows you to compile C/C++ code to WebAssembly (Wasm) and run it in a web browser. This section outlines the steps to build the Previous project using Emscripten.

### Prerequisites

- Install Emscripten by following the [official instructions](https://emscripten.org/docs/getting_started/downloads.html).
- Ensure you have CMake and other build tools required by the project.

### Configuration

1. **Dynamic Memory Growth**: Modify the `CMakeLists.txt` file to enable dynamic memory growth. Add the following line at the appropriate location:

   ```cmake
   set_target_properties(Previous PROPERTIES COMPILE_FLAGS "-s ALLOW_MEMORY_GROWTH=1")
   ```


2. **Emscripten Configuration**: Configure Emscripten by running the following command in your terminal:

   ```bash
   emconfigure ./configure
   ```

3. **Emscripten CMake Configuration**: Build using Emscripten's CMake toolchain:

   ```bash
   emcmake cmake .
   ```

### Building

Run the following command to build the project:

```bash
make
```

### Running

You can host the compiled Wasm files on a local web server and run them in a modern web browser that supports WebAssembly.

### Troubleshooting

- **Canvas Context Errors**: If you encounter issues related to WebGL context, make sure to reference the correct canvas element in your HTML/JavaScript code.
- **Compilation Errors**: Ensure that your environment variables are correctly set for Emscripten and that your build system paths are configured properly.
- **Memory Errors**: If you encounter memory-related errors (e.g., OOM), ensure that dynamic memory growth is enabled as mentioned in the Configuration section.

### References

- [Emscripten Documentation](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html)
- [WebAssembly Guide](https://webassembly.org/getting-started/developers-guide/)

---

You may need to tailor the above content to match the specific details and requirements of your project. Feel free to modify it accordingly.
