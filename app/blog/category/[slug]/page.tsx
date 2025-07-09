"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";

// Mock data for blog posts categorized by STEM areas
const blogPostsByCategory = {
  science: [
    {
      id: "science-1",
      title: "Understanding the Scientific Method Through Play",
      excerpt:
        "How science toys help children grasp the fundamentals of hypothesis testing, observation, and drawing conclusions.",
      date: "June 10, 2023",
      category: "Science",
      image: "/images/category_banner_science_01.png",
      author: "Dr. Amelia Parker",
      content: `
        <p>The scientific method—observe, question, hypothesize, experiment, analyze, conclude—forms the foundation of scientific inquiry. But how do we introduce these concepts to young minds in an engaging way?</p>
        
        <h2>Learning Through Experimentation</h2>
        
        <p>Science-based toys create the perfect environment for children to experience the scientific method organically. When a child builds a volcano model or mixes safe chemicals in a junior chemistry set, they're not just playing—they're developing the fundamental thought processes that underpin scientific discovery.</p>
        
        <h3>Key Benefits of Science Toys</h3>
        <ul>
          <li><strong>Hands-on Learning:</strong> Physical interaction with materials reinforces abstract concepts</li>
          <li><strong>Trial and Error:</strong> Children learn that "failures" provide valuable information</li>
          <li><strong>Observation Skills:</strong> Science toys encourage careful attention to detail and changes</li>
          <li><strong>Critical Thinking:</strong> Children learn to question results and propose new solutions</li>
        </ul>
        
        <h2>Top Science Toys That Teach the Scientific Method</h2>
        
        <h3>1. Microscope Kits</h3>
        <p>These tools of discovery allow children to observe the invisible world around them, developing observation skills and generating questions about what they see.</p>
        
        <h3>2. Crystal Growing Sets</h3>
        <p>These kits teach patience and careful observation as children hypothesize about growth patterns and variables affecting crystal formation.</p>
        
        <h3>3. Weather Station Kits</h3>
        <p>By tracking and recording weather patterns, children learn data collection, analysis, and prediction—core scientific skills.</p>
        
        <h3>4. Circuit Building Sets</h3>
        <p>These sets allow children to experiment with different configurations, teaching cause-and-effect relationships in a tangible way.</p>
        
        <h2>Guiding Scientific Exploration at Home</h2>
        
        <p>Parents can enhance the learning value of science toys by:</p>
        
        <ul>
          <li>Asking open-ended questions: "What do you think will happen if...?"</li>
          <li>Encouraging documentation: Simple journals to record observations</li>
          <li>Embracing curiosity: Following the child's interests rather than directing</li>
          <li>Modeling scientific language: Using terms like "hypothesis," "variable," and "conclusion"</li>
        </ul>
        
        <p>By approaching science as a form of structured play, children develop not just knowledge about specific scientific concepts, but the intellectual framework to understand how knowledge itself is created and verified.</p>
      `,
    },
  ],
  technology: [
    {
      id: "technology-1",
      title: "Coding Through Play: Building Tomorrow's Tech Leaders",
      excerpt:
        "How tech toys and games are teaching children programming concepts while they're having fun.",
      date: "May 22, 2023",
      category: "Technology",
      image: "/images/category_banner_technology_01.png",
      author: "Marcus Rivera",
      content: `
        <p>In our increasingly digital world, coding literacy is becoming as fundamental as reading and writing. Technology toys offer an engaging way to introduce children to computational thinking concepts through play.</p>
        
        <h2>Why Start Coding Early?</h2>
        
        <p>Research shows that children who are exposed to coding concepts before age 10 develop stronger problem-solving skills and logical thinking abilities. Early coding experiences also help demystify technology, empowering children to become creators rather than just consumers of digital content.</p>
        
        <h3>Coding Develops Essential Skills</h3>
        <ul>
          <li><strong>Logical Reasoning:</strong> Understanding how instructions connect and flow</li>
          <li><strong>Problem Decomposition:</strong> Breaking large problems into manageable parts</li>
          <li><strong>Pattern Recognition:</strong> Identifying similarities and creating efficient solutions</li>
          <li><strong>Algorithmic Thinking:</strong> Creating step-by-step procedures to solve problems</li>
        </ul>
        
        <h2>Screen-Free Coding Toys</h2>
        
        <p>Many parents are concerned about screen time, but coding concepts can be taught without digital devices:</p>
        
        <h3>Programmable Robots</h3>
        <p>These physical robots can be programmed using buttons, cards, or other tangible interfaces. Children create sequences of commands that the robot follows, providing immediate physical feedback.</p>
        
        <h3>Coding Board Games</h3>
        <p>These games use cards, tiles, or other physical components to teach coding concepts like loops, conditions, and functions through gameplay.</p>
        
        <h3>Building Sets with Coding Elements</h3>
        <p>Some construction toys incorporate programming challenges where children build structures that must perform specific functions or movements.</p>
        
        <h2>Digital Coding Platforms for Beginners</h2>
        
        <p>When children are ready for screen-based coding, these platforms offer engaging entry points:</p>
        
        <h3>Block-Based Coding</h3>
        <p>Visual programming interfaces where children connect colorful blocks to create programs without typing text. This removes syntax errors and focuses on logical thinking.</p>
        
        <h3>Game-Based Coding Platforms</h3>
        <p>These platforms transform learning to code into an adventure, with characters, stories, and challenges that motivate continued exploration.</p>
        
        <h2>Fostering a Tech-Positive Environment</h2>
        
        <p>Parents can support children's coding journey by:</p>
        
        <ul>
          <li>Celebrating process over product: Praising effort and problem-solving approaches</li>
          <li>Encouraging experimentation: Treating errors as learning opportunities</li>
          <li>Learning alongside: Showing interest by asking questions and participating</li>
          <li>Connecting to real-world technology: Pointing out how code powers everyday devices</li>
        </ul>
        
        <p>By introducing coding concepts through play, we're preparing children not just for potential careers in technology, but for a future where digital literacy will be essential in virtually every field.</p>
      `,
    },
  ],
  engineering: [
    {
      id: "engineering-1",
      title: "Building Young Engineers: Construction Toys and Spatial Thinking",
      excerpt:
        "How building and construction toys develop critical engineering mindsets and spatial reasoning abilities.",
      date: "April 15, 2023",
      category: "Engineering",
      image: "/images/category_banner_engineering_01.png",
      author: "Jennifer Kim",
      content: `
        <p>Engineering isn't just a profession—it's a way of thinking about problems and solutions. Construction toys provide children with hands-on experiences that develop the foundational skills of engineering thinking.</p>
        
        <h2>The Power of Spatial Reasoning</h2>
        
        <p>Spatial reasoning—the ability to visualize and manipulate objects mentally—is one of the strongest predictors of future success in STEM fields. When children build with construction toys, they exercise and strengthen these mental muscles.</p>
        
        <h3>Key Engineering Skills Developed Through Construction Play</h3>
        <ul>
          <li><strong>Structural Stability:</strong> Understanding balance, support, and weight distribution</li>
          <li><strong>Systems Thinking:</strong> Seeing how parts work together to create functional wholes</li>
          <li><strong>Iterative Design:</strong> Testing, refining, and improving designs through multiple attempts</li>
          <li><strong>Scale and Proportion:</strong> Developing intuitive understanding of size relationships</li>
        </ul>
        
        <h2>Types of Construction Toys and Their Benefits</h2>
        
        <h3>Classic Building Blocks</h3>
        <p>Traditional wooden or plastic blocks teach fundamental principles of balance, symmetry, and gravity. Their open-ended nature encourages creativity and problem-solving.</p>
        
        <h3>Interlocking Brick Systems</h3>
        <p>These systems introduce precision engineering, as children learn how pieces connect and how to follow instructions while also creating their own designs.</p>
        
        <h3>Magnetic Construction Sets</h3>
        <p>Magnetic toys teach principles of attraction and repulsion while allowing for more complex and stable three-dimensional structures.</p>
        
        <h3>Engineering Challenge Kits</h3>
        <p>These specialized sets present specific problems to solve, such as building bridges that hold weight or towers that withstand simulated earthquakes.</p>
        
        <h2>Progressive Engineering Challenges</h2>
        
        <p>As children grow, construction play can evolve to incorporate increasingly complex engineering concepts:</p>
        
        <h3>Ages 2-4: Basic Stacking and Balancing</h3>
        <p>Focus on stability, cause-and-effect, and simple spatial relationships.</p>
        
        <h3>Ages 5-7: Following Plans and Simple Machines</h3>
        <p>Introduce building from instructions and basic mechanical elements like wheels, axles, and inclined planes.</p>
        
        <h3>Ages 8-10: Mechanical Systems and Moving Parts</h3>
        <p>Explore gears, pulleys, and other components that transfer motion and force.</p>
        
        <h3>Ages 11+: Programmable Constructions and Complex Mechanics</h3>
        <p>Combine construction with programming and explore advanced concepts like pneumatics or electronic components.</p>
        
        <h2>Supporting the Young Engineer</h2>
        
        <p>Parents and educators can enhance the engineering value of construction play by:</p>
        
        <ul>
          <li>Providing engineering vocabulary: Terms like "load," "structure," "force," and "design"</li>
          <li>Asking process-focused questions: "How did you decide to solve that problem?"</li>
          <li>Documenting the building process: Taking photos of stages to show progression</li>
          <li>Connecting to real-world structures: Pointing out architectural and engineering features in everyday life</li>
        </ul>
        
        <p>By engaging with construction toys in thoughtful ways, children develop not just the technical skills of engineering but the perseverance, creativity, and problem-solving mindset that characterizes successful engineers across disciplines.</p>
      `,
    },
  ],
  math: [
    {
      id: "math-1",
      title:
        "Making Math Fun: Toys That Build Number Sense and Problem-Solving Skills",
      excerpt:
        "How math toys and games develop critical mathematical thinking in an enjoyable, stress-free environment.",
      date: "March 8, 2023",
      category: "Math",
      image: "/images/category_banner_math_01.png",
      author: "Dr. Robert Chen",
      content: `
        <p>Mathematics anxiety is all too common, often stemming from early negative experiences with numbers and calculations. Math toys offer an alternative approach—one that builds mathematical thinking through joyful exploration and discovery.</p>
        
        <h2>Beyond Arithmetic: True Mathematical Thinking</h2>
        
        <p>While calculating correctly is important, true mathematical thinking encompasses much more: pattern recognition, logical reasoning, spatial understanding, and problem-solving strategies. Well-designed math toys develop these broader skills.</p>
        
        <h3>Core Mathematical Concepts Developed Through Play</h3>
        <ul>
          <li><strong>Number Sense:</strong> Understanding quantity, magnitude, and relationships between numbers</li>
          <li><strong>Pattern Recognition:</strong> Identifying sequences and relationships</li>
          <li><strong>Spatial Reasoning:</strong> Visualizing and manipulating shapes and spaces</li>
          <li><strong>Logical Thinking:</strong> Using deductive and inductive reasoning</li>
        </ul>
        
        <h2>Effective Math Toys by Age and Concept</h2>
        
        <h3>Early Counting and Number Recognition (Ages 2-4)</h3>
        <p>Counting bears, number puzzles, and simple board games with number spaces develop basic numeracy in a tactile, engaging way.</p>
        
        <h3>Operations and Place Value (Ages 5-7)</h3>
        <p>Trading games, building block sets with tens and ones, and card games that involve adding and subtracting make these concepts concrete.</p>
        
        <h3>Fractions and Proportional Reasoning (Ages 7-9)</h3>
        <p>Fraction tiles, pizza fraction games, and measuring tools help children visualize parts and wholes.</p>
        
        <h3>Logic and Problem-Solving (Ages 8+)</h3>
        <p>Logic puzzles, strategy games, and construction toys with mathematical challenges develop higher-order thinking skills.</p>
        
        <h2>Mathematical Games vs. "Educational" Drilling</h2>
        
        <p>Research shows that genuinely playful mathematical experiences offer significant advantages over drill-based approaches:</p>
        
        <ul>
          <li>Reduced math anxiety and increased confidence</li>
          <li>Greater persistence when facing challenging problems</li>
          <li>Better transfer of skills to new situations</li>
          <li>More positive attitudes toward mathematics as a discipline</li>
        </ul>
        
        <h2>Creating a Math-Rich Home Environment</h2>
        
        <p>Parents can foster mathematical thinking by:</p>
        
        <ul>
          <li>Embedding math in daily activities: cooking, shopping, and scheduling</li>
          <li>Using mathematical language naturally: "Let's divide these equally" or "I notice a pattern"</li>
          <li>Asking open-ended questions: "How did you figure that out?" or "Can you find another way?"</li>
          <li>Modeling a positive attitude: Expressing curiosity about mathematical ideas rather than anxiety</li>
        </ul>
        
        <h2>Beyond Toys: Mathematical Thinking in Everyday Life</h2>
        
        <p>The ultimate goal of math toys is to develop mathematical habits of mind that extend beyond playtime. Children who develop strong mathematical thinking through play approach the world differently:</p>
        
        <ul>
          <li>They look for patterns and relationships</li>
          <li>They break complex problems into manageable parts</li>
          <li>They make reasonable estimates before calculating</li>
          <li>They ask whether answers make sense in context</li>
        </ul>
        
        <p>By introducing mathematics through play, we can raise a generation that sees math not as a source of anxiety but as a powerful tool for understanding and shaping their world.</p>
      `,
    },
  ],
};

export default function BlogCategoryPage() {
  const { slug } = useParams();
  const { t } = useTranslation();

  // Check if the category exists
  const categorySlug = Array.isArray(slug) ? slug[0] : slug || "";

  // Get posts for this category
  const posts =
    blogPostsByCategory[categorySlug as keyof typeof blogPostsByCategory];

  // If category doesn't exist or has no posts, return 404
  if (!posts || posts.length === 0) {
    notFound();
  }

  // Format category name for display
  const categoryName =
    categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={`/images/category_banner_${categorySlug}_01.png`}
            alt={`${categoryName} Blogs`}
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 via-purple-900/60 to-pink-900/70" />
        </div>
        <div className="container relative z-10 text-white px-3 sm:px-4 lg:px-8">
          <div className="mb-2 sm:mb-4">
            <Button
              variant="ghost"
              className="text-white hover:text-white/90 p-0 h-auto text-xs sm:text-sm"
              asChild
            >
              <Link href="/blog" className="flex items-center gap-1">
                <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
                <span>{t("backToBlog")}</span>
              </Link>
            </Button>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-md">
            {categoryName} Blogs
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mb-3 sm:mb-6 max-w-2xl leading-relaxed drop-shadow-sm">
            Discover our collection of articles about{" "}
            {categoryName.toLowerCase()} topics for children and learning.
          </p>
        </div>
      </section>

      {/* Category Posts */}
      <section className="py-6 sm:py-8 md:py-12 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="container px-3 sm:px-4 lg:px-8 mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mx-auto max-w-7xl">
            {posts.map(post => (
              <div
                key={post.id}
                className="bg-white rounded-lg overflow-hidden shadow-md border border-indigo-100 hover:shadow-xl hover:border-indigo-200 transition-all transform hover:-translate-y-1 duration-300"
              >
                <div className="relative h-40 sm:h-48 w-full">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105 duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
                    <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-medium shadow-sm border border-indigo-200/50">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="mb-1 sm:mb-2 flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-indigo-600 font-medium">
                      {post.date}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 text-indigo-900 line-clamp-2 hover:text-indigo-700 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs md:text-sm text-indigo-600 font-medium truncate max-w-[120px]">
                      By {post.author}
                    </span>
                    <Button
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 shadow-sm transition-all h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 py-0"
                      size="sm"
                      asChild
                    >
                      <Link href={`/blog/post/${post.id}`}>
                        {t("readMore")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Categories */}
      <section className="py-6 sm:py-8 bg-white">
        <div className="container px-3 sm:px-4 lg:px-8 mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-6 text-indigo-900">
            Explore Other Categories
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 max-w-4xl">
            {Object.keys(blogPostsByCategory)
              .filter(cat => cat !== categorySlug)
              .map(cat => (
                <Button
                  key={cat}
                  className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white border-none shadow-md transition-all h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 py-0"
                  size="sm"
                  asChild
                >
                  <Link href={`/blog/category/${cat}`}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Link>
                </Button>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
