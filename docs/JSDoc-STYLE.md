# JSDoc Style Guide for oSlide2

## Format
- Use JSDoc3 format
- `@typedef` for complex objects
- `@param` with types
- `@returns` with types
- `@throws` for errors
- `@async` for promises
- `@example` for usage

## Template
```javascript
/**
 * Function description (1-2 lines)
 * @param {type} name - Description
 * @returns {type} Description
 * @throws {ErrorType} When this happens
 * @example
 * myFunc(123); // Returns "foo"
 */
function myFunc(param) { ... }
```

## Conventions
- Single-line JSDoc (`/** ... */`) for simple functions
- Multi-line for complex functions with params/returns
- Use `@returns {void}` for functions with no return value
- Use `@async` tag for async functions (but not in single-line form)
- Omit `@private` for module-internal functions
