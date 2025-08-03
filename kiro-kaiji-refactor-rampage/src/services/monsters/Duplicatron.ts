/**
 * Duplicatron Monster
 * 
 * Represents massive code duplication across multiple functions.
 * This monster creates repetitive code patterns that violate DRY principles.
 */

import { BaseKaijuMonster, type CodeGenerationOptions, type GeneratedCode } from '../kaijuEngine';
import { KaijuType, type CodeAntiPattern, type DifficultyModifier } from '@/types/kaiju';
import { ProgrammingLanguage } from '@/types/challenge';

export class Duplicatron extends BaseKaijuMonster {
  id = 'duplicatron-001';
  name = 'Duplicatron';
  type = KaijuType.DUPLICATRON;
  description = 'A replicating monster that spreads identical code patterns throughout the codebase.';
  avatar = '👥';
  flavorText = 'Copy, paste, repeat! Why write it once when you can write it everywhere?';

  specialAbilities = [
    'Code Replication: Creates identical logic in multiple places',
    'Pattern Spreading: Duplicates similar but slightly different implementations',
    'Maintenance Nightmare: Makes changes require updates in multiple locations'
  ];

  weaknesses = [
    'DRY Principle: Don\'t Repeat Yourself - extract common functionality',
    'Function Extraction: Moving duplicate code into reusable functions',
    'Template Methods: Using patterns to handle variations in similar code'
  ];

  codePatterns: CodeAntiPattern[] = [
    {
      id: 'identical-functions',
      name: 'Identical Function Bodies',
      description: 'Multiple functions with exactly the same implementation',
      severity: 'high',
      examples: [
        'Copy-pasted validation functions',
        'Identical error handling blocks',
        'Repeated calculation logic'
      ]
    },
    {
      id: 'similar-with-variations',
      name: 'Similar Code with Minor Variations',
      description: 'Nearly identical code blocks with small differences',
      severity: 'medium',
      examples: [
        'Functions that differ only in variable names',
        'Similar loops with different conditions',
        'Repeated patterns with minor modifications'
      ]
    },
    {
      id: 'copy-paste-blocks',
      name: 'Copy-Paste Code Blocks',
      description: 'Large blocks of duplicated code within functions',
      severity: 'medium',
      examples: [
        'Repeated initialization sequences',
        'Identical error handling patterns',
        'Duplicated data transformation logic'
      ]
    }
  ];

  difficultyModifiers: DifficultyModifier[] = [
    {
      factor: 0.8,
      description: 'Increases number of duplicated patterns and variations',
      affectedMetrics: ['duplication_count', 'variation_complexity', 'maintenance_burden']
    }
  ];

  generateCode(options: CodeGenerationOptions): GeneratedCode {
    const { language, difficulty } = options;
    
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        return this.generateJavaScriptCode(difficulty);
      case ProgrammingLanguage.PYTHON:
        return this.generatePythonCode(difficulty);
      default:
        return this.generateJavaScriptCode(difficulty);
    }
  }

  private generateJavaScriptCode(difficulty: number): GeneratedCode {
    const baseCode = `// E-commerce Product Management - Duplicatron Edition

// Product validation functions - all nearly identical
function validateBook(book) {
    if (!book) {
        console.error('Book data is required');
        return false;
    }
    if (!book.title || book.title.trim() === '') {
        console.error('Book title is required');
        return false;
    }
    if (!book.price || book.price <= 0) {
        console.error('Book price must be positive');
        return false;
    }
    if (!book.author || book.author.trim() === '') {
        console.error('Book author is required');
        return false;
    }
    if (!book.isbn || book.isbn.length !== 13) {
        console.error('Book ISBN must be 13 characters');
        return false;
    }
    return true;
}

function validateMovie(movie) {
    if (!movie) {
        console.error('Movie data is required');
        return false;
    }
    if (!movie.title || movie.title.trim() === '') {
        console.error('Movie title is required');
        return false;
    }
    if (!movie.price || movie.price <= 0) {
        console.error('Movie price must be positive');
        return false;
    }
    if (!movie.director || movie.director.trim() === '') {
        console.error('Movie director is required');
        return false;
    }
    if (!movie.duration || movie.duration <= 0) {
        console.error('Movie duration must be positive');
        return false;
    }
    return true;
}

function validateGame(game) {
    if (!game) {
        console.error('Game data is required');
        return false;
    }
    if (!game.title || game.title.trim() === '') {
        console.error('Game title is required');
        return false;
    }
    if (!game.price || game.price <= 0) {
        console.error('Game price must be positive');
        return false;
    }
    if (!game.developer || game.developer.trim() === '') {
        console.error('Game developer is required');
        return false;
    }
    if (!game.platform || game.platform.trim() === '') {
        console.error('Game platform is required');
        return false;
    }
    return true;
}

// Product creation functions - more duplication
function createBook(bookData) {
    if (!validateBook(bookData)) {
        return null;
    }
    
    const book = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'book',
        title: bookData.title,
        price: bookData.price,
        author: bookData.author,
        isbn: bookData.isbn,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
    };
    
    console.log(\`Created book: \${book.title}\`);
    return book;
}

function createMovie(movieData) {
    if (!validateMovie(movieData)) {
        return null;
    }
    
    const movie = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'movie',
        title: movieData.title,
        price: movieData.price,
        director: movieData.director,
        duration: movieData.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
    };
    
    console.log(\`Created movie: \${movie.title}\`);
    return movie;
}

function createGame(gameData) {
    if (!validateGame(gameData)) {
        return null;
    }
    
    const game = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'game',
        title: gameData.title,
        price: gameData.price,
        developer: gameData.developer,
        platform: gameData.platform,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
    };
    
    console.log(\`Created game: \${game.title}\`);
    return game;
}

// Update functions - even more duplication
function updateBook(bookId, updates) {
    // Find book logic duplicated
    let book = null;
    for (let i = 0; i < products.length; i++) {
        if (products[i].id === bookId && products[i].type === 'book') {
            book = products[i];
            break;
        }
    }
    
    if (!book) {
        console.error('Book not found');
        return null;
    }
    
    // Update logic duplicated
    if (updates.title) book.title = updates.title;
    if (updates.price) book.price = updates.price;
    if (updates.author) book.author = updates.author;
    if (updates.isbn) book.isbn = updates.isbn;
    book.updatedAt = new Date();
    
    console.log(\`Updated book: \${book.title}\`);
    return book;
}

function updateMovie(movieId, updates) {
    // Find movie logic duplicated
    let movie = null;
    for (let i = 0; i < products.length; i++) {
        if (products[i].id === movieId && products[i].type === 'movie') {
            movie = products[i];
            break;
        }
    }
    
    if (!movie) {
        console.error('Movie not found');
        return null;
    }
    
    // Update logic duplicated
    if (updates.title) movie.title = updates.title;
    if (updates.price) movie.price = updates.price;
    if (updates.director) movie.director = updates.director;
    if (updates.duration) movie.duration = updates.duration;
    movie.updatedAt = new Date();
    
    console.log(\`Updated movie: \${movie.title}\`);
    return movie;
}

function updateGame(gameId, updates) {
    // Find game logic duplicated
    let game = null;
    for (let i = 0; i < products.length; i++) {
        if (products[i].id === gameId && products[i].type === 'game') {
            game = products[i];
            break;
        }
    }
    
    if (!game) {
        console.error('Game not found');
        return null;
    }
    
    // Update logic duplicated
    if (updates.title) game.title = updates.title;
    if (updates.price) game.price = updates.price;
    if (updates.developer) game.developer = updates.developer;
    if (updates.platform) game.platform = updates.platform;
    game.updatedAt = new Date();
    
    console.log(\`Updated game: \${game.title}\`);
    return game;
}

let products = [];`;

    const complexCode = difficulty > 2 ? `

// Additional duplication for higher difficulty
function deleteBook(bookId) {
    for (let i = 0; i < products.length; i++) {
        if (products[i].id === bookId && products[i].type === 'book') {
            products[i].isActive = false;
            products[i].deletedAt = new Date();
            console.log(\`Deleted book: \${products[i].title}\`);
            return true;
        }
    }
    console.error('Book not found');
    return false;
}

function deleteMovie(movieId) {
    for (let i = 0; i < products.length; i++) {
        if (products[i].id === movieId && products[i].type === 'movie') {
            products[i].isActive = false;
            products[i].deletedAt = new Date();
            console.log(\`Deleted movie: \${products[i].title}\`);
            return true;
        }
    }
    console.error('Movie not found');
    return false;
}

function deleteGame(gameId) {
    for (let i = 0; i < products.length; i++) {
        if (products[i].id === gameId && products[i].type === 'game') {
            products[i].isActive = false;
            products[i].deletedAt = new Date();
            console.log(\`Deleted game: \${products[i].title}\`);
            return true;
        }
    }
    console.error('Game not found');
    return false;
}

// Search functions with duplication
function searchBooks(query) {
    const results = [];
    for (let i = 0; i < products.length; i++) {
        if (products[i].type === 'book' && products[i].isActive) {
            if (products[i].title.toLowerCase().includes(query.toLowerCase()) ||
                products[i].author.toLowerCase().includes(query.toLowerCase())) {
                results.push(products[i]);
            }
        }
    }
    return results;
}

function searchMovies(query) {
    const results = [];
    for (let i = 0; i < products.length; i++) {
        if (products[i].type === 'movie' && products[i].isActive) {
            if (products[i].title.toLowerCase().includes(query.toLowerCase()) ||
                products[i].director.toLowerCase().includes(query.toLowerCase())) {
                results.push(products[i]);
            }
        }
    }
    return results;
}

function searchGames(query) {
    const results = [];
    for (let i = 0; i < products.length; i++) {
        if (products[i].type === 'game' && products[i].isActive) {
            if (products[i].title.toLowerCase().includes(query.toLowerCase()) ||
                products[i].developer.toLowerCase().includes(query.toLowerCase())) {
                results.push(products[i]);
            }
        }
    }
    return results;
}` : '';

    return {
      code: baseCode + complexCode,
      problems: [
        'Validation functions are nearly identical with only field names different',
        'Product creation functions duplicate the same structure and logic',
        'Update functions repeat the same find-and-update pattern',
        'Error handling and logging is duplicated across all functions',
        'Common product properties are repeated in every creation function',
        ...(difficulty > 2 ? [
          'Delete functions duplicate the same soft-delete pattern',
          'Search functions repeat identical filtering and matching logic',
          'Product type checking is scattered and duplicated'
        ] : [])
      ],
      hints: [
        'Extract common validation logic into a generic validator',
        'Create a base product factory with type-specific extensions',
        'Implement a generic find-by-id-and-type function',
        'Use a common error handling and logging utility',
        'Consider using a product class hierarchy or composition',
        ...(difficulty > 2 ? [
          'Implement a generic CRUD operations class',
          'Create a unified search function with type-specific field mapping',
          'Use strategy pattern for type-specific behaviors'
        ] : [])
      ],
      requirements: [
        'Eliminate duplicate validation logic across product types',
        'Create reusable functions for common operations (create, update, find)',
        'Implement a consistent error handling strategy',
        'Reduce code duplication to less than 20% similarity between functions',
        'Maintain the same functionality while improving maintainability'
      ]
    };
  }

  private generatePythonCode(difficulty: number): GeneratedCode {
    const baseCode = `# E-commerce Product Management - Duplicatron Edition

def validate_book(book):
    if not book:
        print('Book data is required')
        return False
    if not book.get('title') or book['title'].strip() == '':
        print('Book title is required')
        return False
    if not book.get('price') or book['price'] <= 0:
        print('Book price must be positive')
        return False
    if not book.get('author') or book['author'].strip() == '':
        print('Book author is required')
        return False
    if not book.get('isbn') or len(book['isbn']) != 13:
        print('Book ISBN must be 13 characters')
        return False
    return True

def validate_movie(movie):
    if not movie:
        print('Movie data is required')
        return False
    if not movie.get('title') or movie['title'].strip() == '':
        print('Movie title is required')
        return False
    if not movie.get('price') or movie['price'] <= 0:
        print('Movie price must be positive')
        return False
    if not movie.get('director') or movie['director'].strip() == '':
        print('Movie director is required')
        return False
    if not movie.get('duration') or movie['duration'] <= 0:
        print('Movie duration must be positive')
        return False
    return True

def validate_game(game):
    if not game:
        print('Game data is required')
        return False
    if not game.get('title') or game['title'].strip() == '':
        print('Game title is required')
        return False
    if not game.get('price') or game['price'] <= 0:
        print('Game price must be positive')
        return False
    if not game.get('developer') or game['developer'].strip() == '':
        print('Game developer is required')
        return False
    if not game.get('platform') or game['platform'].strip() == '':
        print('Game platform is required')
        return False
    return True

def create_book(book_data):
    if not validate_book(book_data):
        return None
    
    import random
    import string
    from datetime import datetime
    
    book = {
        'id': ''.join(random.choices(string.ascii_letters + string.digits, k=9)),
        'type': 'book',
        'title': book_data['title'],
        'price': book_data['price'],
        'author': book_data['author'],
        'isbn': book_data['isbn'],
        'created_at': datetime.now(),
        'updated_at': datetime.now(),
        'is_active': True
    }
    
    print(f"Created book: {book['title']}")
    return book

def create_movie(movie_data):
    if not validate_movie(movie_data):
        return None
    
    import random
    import string
    from datetime import datetime
    
    movie = {
        'id': ''.join(random.choices(string.ascii_letters + string.digits, k=9)),
        'type': 'movie',
        'title': movie_data['title'],
        'price': movie_data['price'],
        'director': movie_data['director'],
        'duration': movie_data['duration'],
        'created_at': datetime.now(),
        'updated_at': datetime.now(),
        'is_active': True
    }
    
    print(f"Created movie: {movie['title']}")
    return movie

def create_game(game_data):
    if not validate_game(game_data):
        return None
    
    import random
    import string
    from datetime import datetime
    
    game = {
        'id': ''.join(random.choices(string.ascii_letters + string.digits, k=9)),
        'type': 'game',
        'title': game_data['title'],
        'price': game_data['price'],
        'developer': game_data['developer'],
        'platform': game_data['platform'],
        'created_at': datetime.now(),
        'updated_at': datetime.now(),
        'is_active': True
    }
    
    print(f"Created game: {game['title']}")
    return game

products = []`;

    return {
      code: baseCode,
      problems: [
        'Validation functions are nearly identical with different field names',
        'Product creation functions duplicate structure and logic',
        'Common imports are repeated in each function',
        'Error messages follow the same pattern but are duplicated',
        'Product dictionary creation is duplicated with minor variations'
      ],
      hints: [
        'Create a generic validation function with field specifications',
        'Extract common product creation logic',
        'Use a product factory with type-specific configurations',
        'Implement reusable error handling',
        'Consider using classes or dataclasses for products'
      ],
      requirements: [
        'Eliminate duplicate validation logic',
        'Create reusable product creation functions',
        'Implement consistent error handling',
        'Reduce code duplication significantly',
        'Maintain all existing functionality'
      ]
    };
  }
}