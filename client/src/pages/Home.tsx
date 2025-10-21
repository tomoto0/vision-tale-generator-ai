import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useRef, useState } from "react";
import { Loader2, Upload, Sparkles, Trash2, BookOpen } from "lucide-react";

interface StoryWithMeta {
  id: string;
  title: string;
  genre: string;
  mood: string;
  story: string;
  imageUrl: string;
  createdAt: Date;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStory, setSelectedStory] = useState<StoryWithMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.story.uploadImage.useMutation();
  const generateStoryMutation = trpc.story.generateStory.useMutation();
  const getStoriesQuery = trpc.story.getMyStories.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const deleteStoryMutation = trpc.story.deleteStory.useMutation();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateStory = async () => {
    if (!selectedImage || !imageFile) return;

    setIsGenerating(true);
    try {
      // Extract base64 from data URL
      const base64 = selectedImage.split(",")[1];

      // Upload image first
      const uploadResult = await uploadImageMutation.mutateAsync({
        base64,
        filename: imageFile.name,
      });

      // Generate story
      const result = await generateStoryMutation.mutateAsync({
        imageUrl: uploadResult.url,
        imageBase64: base64,
      });

      if (result.story) {
        const createdAtDate = result.story.createdAt
          ? (result.story.createdAt instanceof Date
              ? result.story.createdAt
              : new Date(String(result.story.createdAt)))
          : new Date();
        setSelectedStory({
          id: result.story.id,
          title: result.story.title || "Untitled",
          genre: result.story.genre || "Fiction",
          mood: result.story.mood || "Unknown",
          story: result.story.story,
          imageUrl: result.story.imageUrl,
          createdAt: createdAtDate,
        });
      }

      // Refresh stories list
      await getStoriesQuery.refetch();
      setSelectedImage(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error generating story:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteStoryMutation.mutateAsync({ id: storyId });
      await getStoriesQuery.refetch();
      if (selectedStory?.id === storyId) {
        setSelectedStory(null);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16" />}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text">
              Vision Tale Generator
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Transform your photos into captivating stories powered by AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 py-8">
            <div className="space-y-2">
              <BookOpen className="h-8 w-8 mx-auto text-amber-600" />
              <p className="font-semibold">Upload Photo</p>
              <p className="text-sm text-gray-500">Share any image</p>
            </div>
            <div className="space-y-2">
              <Sparkles className="h-8 w-8 mx-auto text-amber-600" />
              <p className="font-semibold">AI Analysis</p>
              <p className="text-sm text-gray-500">GPT-4o Vision</p>
            </div>
            <div className="space-y-2">
              <BookOpen className="h-8 w-8 mx-auto text-amber-600" />
              <p className="font-semibold">Get Story</p>
              <p className="text-sm text-gray-500">Unique narrative</p>
            </div>
          </div>

          <a href={getLoginUrl()}>
            <Button size="lg" className="button-primary">
              Get Started
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b border-amber-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <h1 className="text-2xl font-bold gradient-text">Vision Tale Generator</h1>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Welcome, {user?.name || "Guest"}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card className="glass border-amber-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-amber-600" />
                  Upload Your Photo
                </CardTitle>
                <CardDescription>
                  Choose an image to inspire your story
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-8 text-center cursor-pointer hover:bg-amber-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {selectedImage ? (
                    <div className="space-y-4">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-amber-600 opacity-50" />
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleGenerateStory}
                  disabled={!selectedImage || isGenerating}
                  className="w-full button-primary"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Story...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Story
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Story Display */}
            {selectedStory && (
              <Card className="glass border-amber-200 dark:border-slate-700 slide-up">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl">{selectedStory.title}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium">
                          {selectedStory.genre}
                        </span>
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                          {selectedStory.mood}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img
                    src={selectedStory.imageUrl}
                    alt="Story inspiration"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedStory.story}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Stories History */}
          <div className="lg:col-span-1">
            <Card className="glass border-amber-200 dark:border-slate-700 sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  Your Stories
                </CardTitle>
                <CardDescription>
                  {getStoriesQuery.data?.length || 0} stories created
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getStoriesQuery.isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  </div>
                ) : getStoriesQuery.data && getStoriesQuery.data.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getStoriesQuery.data.map((story) => (
                      <div
                        key={story.id}
                        className="p-3 bg-amber-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors group"
                        onClick={() => {
                          const createdAtDate = story.createdAt
                            ? (story.createdAt instanceof Date
                                ? story.createdAt
                                : new Date(String(story.createdAt)))
                            : new Date();
                          setSelectedStory({
                            id: story.id,
                            title: story.title || "Untitled",
                            genre: story.genre || "Fiction",
                            mood: story.mood || "Unknown",
                            story: story.story,
                            imageUrl: story.imageUrl,
                            createdAt: createdAtDate,
                          });
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                              {story.title || "Untitled"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {story.createdAt instanceof Date
                                ? story.createdAt.toLocaleDateString()
                                : new Date(String(story.createdAt)).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStory(story.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                    No stories yet. Create your first one!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

