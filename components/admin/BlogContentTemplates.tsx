"use client";

import { useState } from "react";
import {
  Lightbulb,
  Zap,
  Target,
  Award,
  BookOpen,
  Plus,
  Copy,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BlogTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  content: string;
  tags: string[];
}

interface BlogContentTemplatesProps {
  onTemplateSelect: (content: string, tags: string[]) => void;
  stemCategory?: string;
}

export default function BlogContentTemplates({
  onTemplateSelect,
  stemCategory,
}: BlogContentTemplatesProps) {
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const templates: BlogTemplate[] = [
    {
      id: "science-intro",
      name: "Science Introduction",
      description: "Perfect for introducing scientific concepts to children",
      category: "SCIENCE",
      icon: <Lightbulb className="h-5 w-5" />,
      content: `# The Amazing World of Science: A Journey of Discovery

## Introduction

Science is all around us, from the smallest atoms to the vast universe. In this article, we'll explore how science shapes our world and why it's so important for children to understand scientific concepts.

## What is Science?

Science is a systematic way of understanding the natural world through observation, experimentation, and evidence-based reasoning. It helps us answer questions about how things work and why they behave the way they do.

## Key Scientific Concepts

### 1. The Scientific Method
The scientific method is a step-by-step process that scientists use to investigate questions:
- **Observation**: Notice something interesting
- **Question**: Ask "why" or "how"
- **Hypothesis**: Make an educated guess
- **Experiment**: Test your hypothesis
- **Analysis**: Look at the results
- **Conclusion**: Draw conclusions

### 2. The Power of Observation
Observation is the foundation of all scientific discovery. By carefully watching the world around us, we can learn amazing things about how nature works.

## Why Science Matters for Children

> "The important thing is not to stop questioning. Curiosity has its own reason for existence." - Albert Einstein

Science education helps children develop:
- **Critical thinking skills**
- **Problem-solving abilities**
- **Curiosity and wonder**
- **Analytical reasoning**

## Fun Science Activities

Here are some simple experiments you can try at home:

### Rainbow in a Glass
**Materials needed:**
- Clear glass
- Water
- Food coloring
- Sugar

**Steps:**
1. Fill the glass with water
2. Add different colors of food coloring
3. Watch the colors mix and create beautiful patterns

### Balloon Magic
**Materials needed:**
- Balloon
- Empty bottle
- Baking soda
- Vinegar

**Steps:**
1. Pour vinegar into the bottle
2. Add baking soda to the balloon
3. Attach balloon to bottle
4. Watch the balloon inflate!

## Conclusion

Science is not just about facts and figures—it's about curiosity, discovery, and understanding the world around us. By encouraging children to explore scientific concepts, we're helping them develop skills that will serve them throughout their lives.

Remember, every great scientist started as a curious child asking questions about the world around them.`,
      tags: ["science", "education", "experiments", "children", "learning"],
    },
    {
      id: "tech-innovation",
      name: "Technology Innovation",
      description:
        "Exploring the latest technological advancements and their impact",
      category: "TECHNOLOGY",
      icon: <Zap className="h-5 w-5" />,
      content: `# The Future of Technology: Innovation That Shapes Tomorrow

## Introduction

Technology is advancing at an unprecedented pace, transforming how we live, work, and learn. In this article, we'll explore the cutting-edge innovations that are shaping our future.

## Emerging Technologies

### Artificial Intelligence (AI)
AI is revolutionizing industries across the board, from healthcare to education. Machine learning algorithms can now:
- **Analyze complex data patterns**
- **Make predictions with high accuracy**
- **Automate repetitive tasks**
- **Enhance decision-making processes**

### Robotics and Automation
Modern robotics are becoming more sophisticated and accessible:
- **Educational robots** for children
- **Automated manufacturing** systems
- **Service robots** in various industries
- **Autonomous vehicles** and drones

## The Impact on Education

Technology is transforming how children learn:

### Interactive Learning
- **Virtual reality** experiences
- **Augmented reality** applications
- **Gamified learning** platforms
- **Personalized education** systems

### Coding and Programming
Learning to code is becoming as important as learning to read and write:
- **Block-based programming** for beginners
- **Python** for intermediate learners
- **Web development** skills
- **App creation** and design

## Future Trends

### Internet of Things (IoT)
Connected devices are creating smart environments:
- **Smart homes** with automated systems
- **Wearable technology** for health monitoring
- **Connected toys** that enhance learning
- **Environmental sensors** for data collection

### Sustainable Technology
Green technology is becoming increasingly important:
- **Renewable energy** solutions
- **Energy-efficient** devices
- **Recyclable materials** in manufacturing
- **Carbon-neutral** technologies

## Preparing Children for the Future

> "The best way to predict the future is to invent it." - Alan Kay

To prepare children for a technology-driven future, we should focus on:

### Essential Skills
1. **Digital literacy** - Understanding how technology works
2. **Critical thinking** - Evaluating information and sources
3. **Creativity** - Using technology to solve problems
4. **Collaboration** - Working with others in digital spaces

### Educational Tools
- **STEM toys** that teach programming
- **Educational apps** for various subjects
- **Online learning** platforms
- **Maker spaces** for hands-on projects

## Conclusion

Technology is not just about gadgets and devices—it's about solving problems, improving lives, and creating opportunities. By introducing children to technology early and in the right way, we're preparing them for a future full of possibilities.

The key is to balance technology use with real-world experiences, ensuring that children develop both digital and social skills.`,
      tags: [
        "technology",
        "innovation",
        "AI",
        "robotics",
        "education",
        "future",
      ],
    },
    {
      id: "engineering-design",
      name: "Engineering Design Process",
      description:
        "Understanding the engineering design process and problem-solving",
      category: "ENGINEERING",
      icon: <Target className="h-5 w-5" />,
      content: `# Engineering Design: Building Solutions Through Innovation

## Introduction

Engineering is the art of solving problems through creative design and systematic thinking. In this article, we'll explore the engineering design process and how it helps us create solutions for real-world challenges.

## The Engineering Design Process

### Step 1: Define the Problem
Every engineering project starts with understanding the problem:
- **Identify the need** or challenge
- **Research existing solutions**
- **Define constraints** and requirements
- **Set clear objectives**

### Step 2: Brainstorm Solutions
Creative thinking is essential in engineering:
- **Generate multiple ideas**
- **Consider different approaches**
- **Think outside the box**
- **Collaborate with others**

### Step 3: Plan and Design
Careful planning leads to better results:
- **Sketch initial designs**
- **Create detailed plans**
- **Select materials and tools**
- **Consider safety and efficiency**

### Step 4: Build and Test
Implementation and testing are crucial:
- **Construct prototypes**
- **Test functionality**
- **Identify problems**
- **Make improvements**

### Step 5: Evaluate and Improve
Continuous improvement is key:
- **Analyze results**
- **Gather feedback**
- **Make refinements**
- **Document lessons learned**

## Types of Engineering

### Civil Engineering
Building the infrastructure of our world:
- **Bridges** and roads
- **Buildings** and structures
- **Water systems** and dams
- **Transportation** networks

### Mechanical Engineering
Creating machines and mechanical systems:
- **Robots** and automation
- **Engines** and motors
- **Tools** and equipment
- **Manufacturing** systems

### Electrical Engineering
Working with electricity and electronics:
- **Circuits** and components
- **Power systems** and grids
- **Communication** devices
- **Control systems**

### Software Engineering
Developing computer programs and systems:
- **Applications** and software
- **Websites** and platforms
- **Games** and simulations
- **Data systems**

## Engineering in Everyday Life

### Simple Machines
Basic engineering principles are everywhere:
- **Levers** - seesaws and scissors
- **Pulleys** - flagpoles and elevators
- **Wheels** - cars and bicycles
- **Inclined planes** - ramps and stairs

### Problem-Solving Examples
Engineering solutions we use daily:
- **Traffic lights** for road safety
- **Water filtration** systems
- **Heating and cooling** systems
- **Communication** networks

## Engineering for Children

### Hands-On Learning
Children learn engineering through:
- **Building blocks** and construction toys
- **Simple machines** kits
- **Circuit building** projects
- **Bridge building** challenges

### Design Challenges
Fun engineering activities:
- **Paper airplane** design
- **Egg drop** protection
- **Tower building** competitions
- **Rube Goldberg** machines

## The Future of Engineering

### Emerging Fields
New engineering disciplines are emerging:
- **Biomedical engineering** for healthcare
- **Environmental engineering** for sustainability
- **Aerospace engineering** for space exploration
- **Robotics engineering** for automation

### Skills for the Future
Essential engineering skills:
- **Computational thinking**
- **3D modeling** and design
- **Programming** and coding
- **Data analysis** and interpretation

## Conclusion

Engineering is more than just building things—it's about solving problems, improving lives, and creating a better future. By introducing children to engineering concepts early, we're helping them develop the skills they need to become the innovators and problem-solvers of tomorrow.

The engineering design process teaches valuable life skills: patience, persistence, creativity, and the ability to learn from failure. These are skills that will serve children well in any career they choose.`,
      tags: [
        "engineering",
        "design",
        "problem-solving",
        "innovation",
        "STEM",
        "education",
      ],
    },
    {
      id: "math-concepts",
      name: "Mathematical Concepts",
      description: "Making mathematics fun and accessible for children",
      category: "MATHEMATICS",
      icon: <Award className="h-5 w-5" />,
      content: `# Mathematics: The Language of the Universe

## Introduction

Mathematics is often called the language of the universe because it helps us understand patterns, solve problems, and make sense of the world around us. In this article, we'll explore how to make mathematics engaging and accessible for children.

## Why Mathematics Matters

### Universal Language
Mathematics is used everywhere:
- **Science** and research
- **Technology** and engineering
- **Business** and finance
- **Art** and music
- **Everyday life** and decision-making

### Problem-Solving Skills
Math develops essential thinking skills:
- **Logical reasoning**
- **Pattern recognition**
- **Critical thinking**
- **Analytical skills**

## Fundamental Mathematical Concepts

### Numbers and Counting
The foundation of all mathematics:
- **Natural numbers** (1, 2, 3, ...)
- **Whole numbers** (0, 1, 2, 3, ...)
- **Integers** (..., -2, -1, 0, 1, 2, ...)
- **Fractions** and decimals
- **Real numbers** and beyond

### Basic Operations
The four fundamental operations:
- **Addition** - combining quantities
- **Subtraction** - finding differences
- **Multiplication** - repeated addition
- **Division** - sharing and grouping

### Geometry and Shapes
Understanding space and form:
- **2D shapes** - circles, squares, triangles
- **3D shapes** - cubes, spheres, pyramids
- **Lines** and angles
- **Area** and perimeter
- **Volume** and surface area

## Making Math Fun

### Games and Activities
Learning through play:
- **Number games** and puzzles
- **Shape sorting** and matching
- **Pattern recognition** activities
- **Measurement** experiments

### Real-World Applications
Connecting math to everyday life:
- **Cooking** and recipe measurements
- **Shopping** and money management
- **Time** and scheduling
- **Sports** statistics and scores

## Advanced Mathematical Concepts

### Algebra
Working with variables and equations:
- **Variables** and expressions
- **Equations** and inequalities
- **Functions** and graphs
- **Patterns** and sequences

### Statistics and Probability
Understanding data and chance:
- **Data collection** and organization
- **Graphs** and charts
- **Averages** and measures of center
- **Probability** and chance

### Calculus
The mathematics of change:
- **Rates** of change
- **Accumulation** and area
- **Optimization** problems
- **Modeling** real-world phenomena

## Mathematical Thinking

### Problem-Solving Strategies
Effective approaches to math problems:
1. **Understand** the problem
2. **Plan** a solution strategy
3. **Execute** the plan
4. **Review** and check the answer

### Mathematical Reasoning
Developing logical thinking:
- **Deductive reasoning** - drawing conclusions
- **Inductive reasoning** - finding patterns
- **Spatial reasoning** - understanding space
- **Numerical reasoning** - working with numbers

## Technology and Mathematics

### Digital Tools
Modern tools for learning math:
- **Calculators** and computers
- **Educational apps** and software
- **Online resources** and tutorials
- **Interactive simulations**

### Coding and Mathematics
Programming as mathematical thinking:
- **Algorithms** and procedures
- **Variables** and data structures
- **Logic** and control flow
- **Problem decomposition**

## Overcoming Math Anxiety

### Building Confidence
Strategies for success:
- **Start with basics** and build up
- **Practice regularly** with fun activities
- **Celebrate small victories**
- **Learn from mistakes**

### Growth Mindset
Developing a positive attitude:
- **Embrace challenges** as opportunities
- **Persist** through difficulties
- **Learn** from feedback
- **Find inspiration** in others' success

## Conclusion

Mathematics is not just about numbers and formulas—it's about thinking logically, solving problems, and understanding the world around us. By making mathematics engaging and accessible, we're helping children develop skills that will serve them throughout their lives.

Remember, every mathematician started as a child counting fingers and toes. The key is to nurture curiosity, build confidence, and show children that mathematics is both useful and beautiful.

> "Mathematics is the art of giving the same name to different things." - Henri Poincaré

This quote reminds us that mathematics is about finding patterns and connections, making it a powerful tool for understanding our complex world.`,
      tags: [
        "mathematics",
        "education",
        "problem-solving",
        "STEM",
        "learning",
        "numbers",
      ],
    },
  ];

  const filteredTemplates = stemCategory
    ? templates.filter(template => template.category === stemCategory)
    : templates;

  const handleTemplateSelect = (template: BlogTemplate) => {
    onTemplateSelect(template.content, template.tags);
    setCopiedTemplate(template.id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "SCIENCE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "TECHNOLOGY":
        return "bg-green-100 text-green-800 border-green-200";
      case "ENGINEERING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "MATHEMATICS":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Professional Blog Templates</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {template.icon}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={getCategoryColor(template.category)}
                  >
                    {template.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Tags:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full"
                    variant="outline"
                  >
                    {copiedTemplate === template.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Template Applied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Use This Template
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
